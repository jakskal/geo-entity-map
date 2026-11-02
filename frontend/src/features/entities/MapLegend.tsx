import { useState } from 'react'
import { ENTITY_TYPE_LABELS, ENTITY_TYPES, STATUS_LABELS, STATUSES } from './entity'
import { ENTITY_TYPE_ICONS, STATUS_COLORS } from './markerStyle'

/**
 * Explains marker colours (Status) and icons (Entity Type). Placed by the
 * caller. On narrow screens it starts collapsed behind a toggle; from `sm` up
 * it is always open and the toggle is hidden.
 */
export function MapLegend() {
  const [open, setOpen] = useState(false)

  return (
    <section
      aria-labelledby="map-legend-title"
      className="rounded bg-white/95 p-3 text-sm shadow"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="map-legend-title" className="font-semibold">
          Legend
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="map-legend-body"
          onClick={() => setOpen(!open)}
          className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50 sm:hidden"
        >
          {open ? 'Hide legend' : 'Show legend'}
        </button>
      </div>
      <div id="map-legend-body" className={`${open ? 'flex' : 'hidden'} mt-2 gap-6 sm:flex`}>
        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-500 uppercase">Status</h3>
          <ul className="space-y-1">
            {STATUSES.map((status) => (
              <li key={status} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: STATUS_COLORS[status] }}
                />
                <span>{STATUS_LABELS[status]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-500 uppercase">Entity Type</h3>
          <ul className="space-y-1">
            {ENTITY_TYPES.map((type) => (
              <li key={type} className="flex items-center gap-2">
                <span aria-hidden="true">{ENTITY_TYPE_ICONS[type]}</span>
                <span>{ENTITY_TYPE_LABELS[type]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
