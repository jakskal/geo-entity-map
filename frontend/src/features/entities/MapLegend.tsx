import { ENTITY_TYPE_LABELS, ENTITY_TYPES, STATUS_LABELS, STATUSES } from './entity'
import { ENTITY_TYPE_ICONS, STATUS_COLORS } from './markerStyle'

/** Explains marker colours (Status) and icons (Entity Type). */
export function MapLegend() {
  return (
    <section
      aria-labelledby="map-legend-title"
      className="absolute bottom-6 left-4 z-[1000] rounded bg-white/95 p-3 text-sm shadow"
    >
      <h2 id="map-legend-title" className="mb-2 font-semibold">
        Legend
      </h2>
      <div className="flex gap-6">
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
