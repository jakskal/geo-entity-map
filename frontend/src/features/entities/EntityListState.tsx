import type { UseQueryResult } from '@tanstack/react-query'
import { ApiError } from '../../api/client'
import type { Entity } from './entity'

const NOTICE = 'absolute top-4 left-1/2 z-[1000] -translate-x-1/2 rounded bg-white px-4 py-2 shadow'

/**
 * Loading, error (with retry) and empty-state notices over the map. With
 * filters active, an empty result is reported by the side list instead.
 */
export function EntityListState({
  query,
  filtered = false,
}: {
  query: UseQueryResult<Entity[]>
  filtered?: boolean
}) {
  if (query.isPending) {
    return (
      <p role="status" className={NOTICE}>
        Loading Entities…
      </p>
    )
  }

  if (query.isError) {
    return (
      <div role="alert" className={`${NOTICE} flex items-center gap-3 text-red-700`}>
        <span>Could not load Entities{requestIdSuffix(query.error)}</span>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    )
  }

  if (query.data.length === 0 && !filtered) {
    return (
      <p className={NOTICE}>No Entities yet. Click anywhere on the map to create the first one.</p>
    )
  }

  return null
}

function requestIdSuffix(error: Error): string {
  return error instanceof ApiError && error.requestId ? ` (request id: ${error.requestId})` : ''
}
