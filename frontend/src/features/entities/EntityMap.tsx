import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo, useRef, type Ref } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Entity, Location } from './entity'
import { markerIcon } from './markerStyle'

/** Bandung, West Java — where the sample Entities live. */
const BANDUNG: [number, number] = [-6.9175, 107.6191]
const DEFAULT_ZOOM = 13
/** Don't zoom in further than street level when fitting a single Entity. */
const FIT_MAX_ZOOM = 15

type EntityMapProps = {
  entities: Entity[]
  /** Receives the Leaflet map, e.g. to read its centre. */
  mapRef?: Ref<L.Map>
  /** The Entity whose marker is highlighted, if any. */
  selectedEntityId?: string | null
  /** Called with the Entity whose marker was clicked. */
  onSelectEntity?: (entity: Entity) => void
  /** Called with the Location of a click on empty map (not on a marker). */
  onMapClick?: (location: Location) => void
  /**
   * Makes markers draggable. Called with the Entity and the Location its marker
   * was dropped at; if the returned promise rejects, the marker goes back to
   * the Entity's saved Location.
   */
  onMoveEntity?: (entity: Entity, location: Location) => Promise<unknown>
}

/** Full-size OpenStreetMap map with one marker per Entity at its Location. */
export function EntityMap({
  entities,
  mapRef,
  selectedEntityId,
  onSelectEntity,
  onMapClick,
  onMoveEntity,
}: EntityMapProps) {
  return (
    <div data-testid="entity-map" className="h-full w-full">
      <MapContainer ref={mapRef} center={BANDUNG} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {entities.map((entity) => (
          <EntityMarker
            key={entity.id}
            entity={entity}
            selected={entity.id === selectedEntityId}
            onSelect={onSelectEntity}
            onMove={onMoveEntity}
          />
        ))}
        <FitToEntitiesOnce entities={entities} />
        {onMapClick && <MapClickListener onMapClick={onMapClick} />}
      </MapContainer>
    </div>
  )
}

/** Location of a Leaflet point, rounded to 6 decimals (about 10 cm). */
export function toLocation(point: L.LatLng): Location {
  const round = (value: number) => Math.round(value * 1e6) / 1e6
  return { latitude: round(point.lat), longitude: round(point.lng) }
}

/** One Entity's marker; draggable when `onMove` is given. */
function EntityMarker({
  entity,
  selected,
  onSelect,
  onMove,
}: {
  entity: Entity
  selected: boolean
  onSelect?: (entity: Entity) => void
  onMove?: (entity: Entity, location: Location) => Promise<unknown>
}) {
  const { latitude, longitude } = entity
  // react-leaflet moves the marker whenever `position` is a new array, so keep
  // it stable: a dragged marker then stays where it was dropped while the new
  // Location is saved, and only moves when the saved Location changes.
  const position = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude])

  return (
    <Marker
      position={position}
      icon={markerIcon(entity, { selected })}
      zIndexOffset={selected ? 1000 : 0}
      draggable={onMove !== undefined}
      eventHandlers={{
        click: () => onSelect?.(entity),
        dragend: (event) => {
          if (!onMove) return
          const marker = event.target as L.Marker
          // wrap() keeps the longitude within -180..180 if the map was panned round the globe.
          onMove(entity, toLocation(marker.getLatLng().wrap())).catch(() => {
            marker.setLatLng(position)
          })
        },
      }}
    >
      <Tooltip>{entity.name}</Tooltip>
    </Marker>
  )
}

/** Reports clicks on empty map; marker clicks don't reach the map. */
function MapClickListener({ onMapClick }: { onMapClick: (location: Location) => void }) {
  useMapEvents({ click: (event) => onMapClick(toLocation(event.latlng)) })
  return null
}

/**
 * Fits the map to all Entities the first time any arrive. Later changes
 * (filters, edits) leave the operator's view alone. With no Entities the
 * map stays on Bandung.
 */
function FitToEntitiesOnce({ entities }: { entities: Entity[] }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (hasFitted.current || entities.length === 0) return
    hasFitted.current = true
    const bounds = L.latLngBounds(entities.map((entity) => [entity.latitude, entity.longitude]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: FIT_MAX_ZOOM })
  }, [entities, map])

  return null
}
