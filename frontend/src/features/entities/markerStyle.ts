import L from 'leaflet'
import type { Entity, EntityType, Status } from './entity'

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
/** The selected marker is drawn larger with a dark ring around it. */
const SELECTED_MARKER_SIZE = 44

/**
 * A round marker filled with the Status colour, showing the Entity Type icon.
 * The Entity's name is in the marker as screen-reader text, which also gives
 * the (keyboard-focusable) marker its accessible name.
 */
export function markerIcon(entity: Entity, { selected = false } = {}): L.DivIcon {
  const size = selected ? SELECTED_MARKER_SIZE : MARKER_SIZE
  const border = selected ? '4px solid #1e3a8a' : '2px solid white'
  const shadow = selected ? '0 0 0 3px white, 0 2px 8px rgba(0,0,0,.6)' : '0 1px 4px rgba(0,0,0,.4)'
  return L.divIcon({
    className: '', // drop Leaflet's default white square
    html:
      `<div style="width:${size}px;height:${size}px;background:${STATUS_COLORS[entity.status]};border:${border};border-radius:50%;box-shadow:${shadow};box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:16px">` +
      `<span aria-hidden="true">${ENTITY_TYPE_ICONS[entity.type]}</span>` +
      `<span class="sr-only">${escapeHtml(entity.name)}</span>` +
      `</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  })
}

/** divIcon takes raw HTML; an Entity name must never be able to inject markup. */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
