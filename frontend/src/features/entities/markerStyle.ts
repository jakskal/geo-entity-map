import L from 'leaflet'
import type { EntityType, Status } from './entity'

// How an Entity looks on the map: colour = Status, icon = Entity Type.
// The legend reads the same tables, so the two can never disagree.

export const STATUS_COLORS: Record<Status, string> = {
  active: '#16a34a', // green
  inactive: '#6b7280', // grey
  maintenance: '#f59e0b', // amber
  offline: '#dc2626', // red
}

export const ENTITY_TYPE_ICONS: Record<EntityType, string> = {
  vehicle: '🚚',
  iot_device: '📡',
  facility: '🏭',
  other: '📍',
}

const MARKER_SIZE = 32

/** A round marker filled with the Status colour, showing the Entity Type icon. */
export function markerIcon(type: EntityType, status: Status): L.DivIcon {
  return L.divIcon({
    className: '', // drop Leaflet's default white square
    html: `<div style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;background:${STATUS_COLORS[status]};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:16px">${ENTITY_TYPE_ICONS[type]}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    tooltipAnchor: [0, -MARKER_SIZE / 2],
  })
}
