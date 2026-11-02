import { delay, http, HttpResponse } from 'msw'
import type { Entity, EntityInput } from '../features/entities/entity'

// Reusable MSW handlers that answer like the Go API's Entity endpoints.

const LIST_URL = '/api/entities'

let nextId = 1

/** Builds a valid Entity; override only the fields a test cares about. */
export function makeEntity(overrides: Partial<Entity> = {}): Entity {
  const id = `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`
  return {
    id,
    name: 'Delivery Van 1',
    type: 'vehicle',
    status: 'active',
    latitude: -6.9175,
    longitude: 107.6191,
    description: '',
    attributes: {},
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
    ...overrides,
  }
}

/**
 * GET /api/entities answering with the given Entities, filtered by the
 * `type` and `status` query parameters and sorted by name, like the backend.
 */
export function listEntitiesHandler(entities: Entity[]) {
  return http.get(LIST_URL, ({ request }) => {
    const params = new URL(request.url).searchParams
    const type = params.get('type')
    const status = params.get('status')
    const matching = entities
      .filter((entity) => !type || entity.type === type)
      .filter((entity) => !status || entity.status === status)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    return HttpResponse.json(matching)
  })
}

const ONE_URL = '/api/entities/:id'

/**
 * GET /api/entities/:id answering from the given Entities, with the backend's
 * 404 body for any other id.
 */
export function getEntityHandler(entities: Entity[]) {
  return http.get(ONE_URL, ({ params }) => {
    const entity = entities.find((candidate) => candidate.id === params.id)
    return entity ? HttpResponse.json(entity) : notFoundResponse()
  })
}

/** GET /api/entities/:id always answering 404, as for an Entity deleted elsewhere. */
export function getEntityNotFoundHandler() {
  return http.get(ONE_URL, () => notFoundResponse())
}

function notFoundResponse(requestId = 'req-get-404') {
  return HttpResponse.json(
    { error: 'not_found', message: 'entity not found', requestId },
    { status: 404, headers: { 'X-Request-ID': requestId } },
  )
}

/**
 * POST /api/entities answering 201 with the created Entity, like the backend:
 * server-assigned id and timestamps, trimmed name. Pass the same array to
 * `listEntitiesHandler` to have later list requests include it.
 */
export function createEntityHandler(store: Entity[] = []) {
  return http.post<never, EntityInput>(LIST_URL, async ({ request }) => {
    const input = await request.json()
    const created = makeEntity({
      ...input,
      name: input.name.trim(),
      createdAt: '2026-11-02T09:00:00Z',
      updatedAt: '2026-11-02T09:00:00Z',
    })
    store.push(created)
    return HttpResponse.json(created, { status: 201 })
  })
}

/**
 * Any Entity endpoint failing with the backend's error body, e.g. a 422
 * `validation_failed` with `fields`, or a 500 `internal`.
 */
export function entityErrorResponse({
  status,
  fields,
  requestId = `req-${status}`,
}: {
  status: number
  fields?: Record<string, string>
  requestId?: string
}) {
  const body = fields
    ? { error: 'validation_failed', message: 'validation failed', fields, requestId }
    : { error: 'internal', message: 'internal server error', requestId }
  return HttpResponse.json(body, { status, headers: { 'X-Request-ID': requestId } })
}

/** POST /api/entities failing with the given error (see entityErrorResponse). */
export function createEntityErrorHandler(error: Parameters<typeof entityErrorResponse>[0]) {
  return http.post(LIST_URL, () => entityErrorResponse(error))
}

/**
 * DELETE /api/entities/:id answering 204 and removing the Entity from the
 * given array, like the backend; 404 for any other id. Pass the same array to
 * `listEntitiesHandler` so later list requests no longer include it.
 */
export function deleteEntityHandler(store: Entity[]) {
  return http.delete(ONE_URL, ({ params }) => {
    const index = store.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return notFoundResponse('req-delete-404')
    store.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  })
}

/** DELETE /api/entities/:id failing with the given error (see entityErrorResponse). */
export function deleteEntityErrorHandler(error: Parameters<typeof entityErrorResponse>[0]) {
  return http.delete(ONE_URL, () => entityErrorResponse(error))
}

/** GET /api/entities that never answers, to observe the loading state. */
export function listEntitiesPendingHandler() {
  return http.get(LIST_URL, async () => {
    await delay('infinite')
    return HttpResponse.json([])
  })
}

/**
 * GET /api/entities failing once with a 500, the way the backend reports it.
 * Register a success handler after it to answer the retry.
 */
export function listEntitiesErrorHandler({ requestId = 'req-list-500' } = {}) {
  return http.get(
    LIST_URL,
    () =>
      HttpResponse.json(
        { error: 'internal', message: 'internal server error', requestId },
        { status: 500, headers: { 'X-Request-ID': requestId } },
      ),
    { once: true },
  )
}
