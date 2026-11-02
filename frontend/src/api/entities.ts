import { useQuery } from '@tanstack/react-query'
import type { Entity, EntityFilters } from '../features/entities/entity'
import { apiFetch } from './client'

/** Query keys for Entity data; mutations use these to update the cache. */
export const entityKeys = {
  all: ['entities'] as const,
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

function toQueryString(filters: EntityFilters): string {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.status) params.set('status', filters.status)
  const query = params.toString()
  return query ? `?${query}` : ''
}
