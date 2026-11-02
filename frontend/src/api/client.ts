// Small JSON fetch client for the backend's `/api`.
// Every non-2xx response becomes an ApiError, so callers (and TanStack Query)
// only ever deal with one error shape.

const API_BASE = '/api'

/**
 * Machine-readable error codes the backend returns in the `error` field, plus
 * `timeout`, which the client sets itself when no response arrives in time.
 */
export type ApiErrorCode = 'validation_failed' | 'bad_request' | 'not_found' | 'internal' | 'timeout'

/** How long a request may take before the client gives up (see docs/log.md). */
export const REQUEST_TIMEOUT_MS = 10_000

export class ApiError extends Error {
  /** HTTP status, or 0 when no response arrived (timeout). */
  readonly status: number
  readonly code: ApiErrorCode
  /** Per-field reasons; filled only for 422 `validation_failed` responses. */
  readonly fields: Record<string, string>
  /** The request ID the backend logged this request under, if it sent one. */
  readonly requestId: string | undefined

  constructor(options: {
    status: number
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
    requestId?: string
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.fields = options.fields ?? {}
    this.requestId = options.requestId
  }
}

/**
 * " (request id: …)" when the error is an ApiError that carries a request ID,
 * otherwise "". Append it to every error message the operator sees.
 */
export function requestIdSuffix(error: unknown): string {
  return error instanceof ApiError && error.requestId ? ` (request id: ${error.requestId})` : ''
}

/** A failed request as one message for the operator, with the request ID when known. */
export function generalMessage(error: unknown): string {
  const suffix = requestIdSuffix(error)
  return suffix ? `Something went wrong${suffix}` : 'Something went wrong. Please try again.'
}

type ErrorBody = {
  error?: ApiErrorCode
  message?: string
  fields?: Record<string, string>
  requestId?: string
}

export type ApiRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
  signal?: AbortSignal
  /** Give up after this many milliseconds; defaults to REQUEST_TIMEOUT_MS. */
  timeoutMs?: number
}

/**
 * Calls `/api{path}` and returns the parsed JSON body (or `undefined` for 204).
 * Throws ApiError for any non-2xx response, or when no response arrives
 * within the timeout. A cancel through the caller's `signal` still rejects
 * with the usual AbortError, so TanStack Query can tell it apart.
 */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = REQUEST_TIMEOUT_MS } = request
  const timeout = AbortSignal.timeout(timeoutMs)
  let response: Response
  try {
    response = await fetch(toUrl(`${API_BASE}${path}`), {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (timeout.aborted) {
      throw new ApiError({ status: 0, code: 'timeout', message: 'The request timed out' })
    }
    throw error
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  // The body may not be JSON (e.g. a proxy's 502 page); fall back to defaults.
  const body: ErrorBody = await response.json().catch(() => ({}))
  return new ApiError({
    status: response.status,
    code: body.error ?? defaultCode(response.status),
    message: body.message ?? `Request failed with status ${response.status}`,
    fields: body.fields,
    requestId: response.headers.get('X-Request-ID') ?? body.requestId,
  })
}

function defaultCode(status: number): ApiErrorCode {
  if (status === 404) return 'not_found'
  if (status === 422) return 'validation_failed'
  if (status >= 400 && status < 500) return 'bad_request'
  return 'internal'
}

// The browser resolves relative URLs itself; Node's fetch (used in tests)
// needs an absolute one, so resolve against the current page.
function toUrl(path: string): string {
  return new URL(path, window.location.href).toString()
}
