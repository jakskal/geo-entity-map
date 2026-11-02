import { useState } from 'react'
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPES,
  STATUS_LABELS,
  STATUSES,
  hasActiveFilters,
  type Entity,
  type EntityFilters,
  type EntityType,
  type Status,
} from './entity'
import { STATUS_COLORS } from './markerStyle'

type EntityListProps = {
  /** The same list query result the map renders. */
  entities: Entity[]
  filters: EntityFilters
  onFiltersChange: (filters: EntityFilters) => void
  selectedEntityId: string | null
  onSelectEntity: (entity: Entity) => void
}

const SELECT = 'w-full rounded border border-gray-300 bg-white px-2 py-1'

/**
 * Side list of the Entities shown on the map, with Entity Type and Status
 * filters, a count and "Clear filters". Collapsible so it fits narrow screens.
 */
export function EntityList({
  entities,
  filters,
  onFiltersChange,
  selectedEntityId,
  onSelectEntity,
}: EntityListProps) {
  const [open, setOpen] = useState(true)
  const hasFilters = hasActiveFilters(filters)

  return (
    <section
      aria-labelledby="entity-list-title"
      className="absolute top-4 left-14 z-[1000] flex max-h-[calc(100vh-15rem)] w-72 max-w-[calc(100vw-4.5rem)] flex-col rounded bg-white/95 text-sm shadow"
    >
      <header className="flex items-center justify-between gap-2 p-3">
        <h2 id="entity-list-title" className="font-semibold">
          Entities
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="entity-list-body"
          onClick={() => setOpen(!open)}
          className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50"
        >
          {open ? 'Hide list' : 'Show list'}
        </button>
      </header>

      {open && (
        <div id="entity-list-body" className="flex min-h-0 flex-col border-t">
          <div className="grid grid-cols-2 gap-2 p-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">
                <span className="sr-only">Filter by </span>Entity Type
              </span>
              <select
                value={filters.type ?? ''}
                // An empty value means "no filter", as on the backend.
                onChange={(event) =>
                  onFiltersChange({ ...filters, type: (event.target.value || undefined) as EntityType | undefined })
                }
                className={SELECT}
              >
                <option value="">All</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ENTITY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">
                <span className="sr-only">Filter by </span>Status
              </span>
              <select
                value={filters.status ?? ''}
                onChange={(event) =>
                  onFiltersChange({ ...filters, status: (event.target.value || undefined) as Status | undefined })
                }
                className={SELECT}
              >
                <option value="">All</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-gray-600">
              {entities.length} {entities.length === 1 ? 'Entity' : 'Entities'} shown
            </p>
            <button
              type="button"
              onClick={() => onFiltersChange({})}
              disabled={!hasFilters}
              className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              Clear filters
            </button>
          </div>

          {entities.length === 0 && hasFilters && (
            <p className="px-3 pb-3 text-gray-600">No Entities match these filters.</p>
          )}
          {entities.length > 0 && (
            <ul className="min-h-0 overflow-y-auto border-t">
              {entities.map((entity) => {
                const selected = entity.id === selectedEntityId
                return (
                  <li key={entity.id}>
                    <button
                      type="button"
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => onSelectEntity(entity)}
                      className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-100 ${selected ? 'bg-blue-50' : ''}`}
                    >
                      <span data-entity-name className="font-medium break-words">
                        {entity.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{ENTITY_TYPE_LABELS[entity.type]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <span
                            aria-hidden="true"
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: STATUS_COLORS[entity.status] }}
                          />
                          {STATUS_LABELS[entity.status]}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
