import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef, type Ref } from 'react'
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
}

/** Full-size OpenStreetMap map with one marker per Entity at its Location. */
export function EntityMap({ entities, mapRef, selectedEntityId, onSelectEntity, onMapClick }: EntityMapProps) {
  return (
    <div data-testid="entity-map" className="h-full w-full">
      <MapContainer ref={mapRef} center={BANDUNG} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {entities.map((entity) => {
          const selected = entity.id === selectedEntityId
          return (
            <Marker
              key={entity.id}
              position={[entity.latitude, entity.longitude]}
              icon={markerIcon(entity, { selected })}
              zIndexOffset={selected ? 1000 : 0}
              eventHandlers={{ click: () => onSelectEntity?.(entity) }}
            >
              <Tooltip>{entity.name}</Tooltip>
            </Marker>
          )
        })}
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
