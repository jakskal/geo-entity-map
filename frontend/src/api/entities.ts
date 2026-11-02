import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Entity, EntityFilters, EntityInput } from '../features/entities/entity'
import { apiFetch } from './client'

/** Query keys for Entity data; mutations use these to update the cache. */
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => ['entities', 'list'] as const,
  list: (filters: EntityFilters) => ['entities', 'list', filters] as const,
  detail: (id: string) => ['entities', 'detail', id] as const,
}

/** Fetches the Entity list, optionally filtered by Entity Type and/or Status. */
export function useEntities(filters: EntityFilters = {}) {
  return useQuery({
    queryKey: entityKeys.list(filters),
    queryFn: ({ signal }) => apiFetch<Entity[]>(`/entities${toQueryString(filters)}`, { signal }),
  })
}

/** Fetches one Entity by id; a vanished Entity fails with a 404 ApiError. */
export function useEntity(id: string) {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: ({ signal }) => apiFetch<Entity>(`/entities/${encodeURIComponent(id)}`, { signal }),
  })
}

/**
 * Creates an Entity. On success the new Entity is added to every cached list
 * whose filters it matches (so its marker appears at once), then all Entity
 * queries are refetched in the background so the server's data wins.
 */
export function useCreateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EntityInput) =>
      apiFetch<Entity>('/entities', { method: 'POST', body: input }),
    onSuccess: (created) => {
      const lists = queryClient.getQueriesData<Entity[]>({ queryKey: entityKeys.lists() })
      for (const [queryKey, entities] of lists) {
        const filters = (queryKey[2] ?? {}) as EntityFilters
        if (entities && matchesFilters(created, filters)) {
          queryClient.setQueryData(queryKey, [...entities, created])
        }
      }
      void queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

/**
 * Replaces an Entity's writable fields with a full PUT. On success the get-one
 * cache gets the saved Entity and every cached list shows it (or drops it when
 * it no longer matches that list's filters), then all Entity queries are
 * refetched in the background so the server's data wins.
 */
export function useUpdateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EntityInput }) =>
      apiFetch<Entity>(`/entities/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
    onSuccess: (updated) => {
      queryClient.setQueryData(entityKeys.detail(updated.id), updated)
      const lists = queryClient.getQueriesData<Entity[]>({ queryKey: entityKeys.lists() })
      for (const [queryKey, entities] of lists) {
        if (!entities) continue
        const filters = (queryKey[2] ?? {}) as EntityFilters
        const others = entities.filter((entity) => entity.id !== updated.id)
        queryClient.setQueryData(
          queryKey,
          matchesFilters(updated, filters) ? [...others, updated] : others,
        )
      }
      void queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

function matchesFilters(entity: Entity, filters: EntityFilters): boolean {
  return (
    (!filters.type || entity.type === filters.type) &&
    (!filters.status || entity.status === filters.status)
  )
}

function toQueryString(filters: EntityFilters): string {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.status) params.set('status', filters.status)
  const query = params.toString()
  return query ? `?${query}` : ''
}
