import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

/** Bandung, West Java — where the sample Entities live. */
const BANDUNG: [number, number] = [-6.9175, 107.6191]
const DEFAULT_ZOOM = 13

/** Full-size OpenStreetMap map. Entity markers are added by later features. */
export function EntityMap() {
  return (
    <div data-testid="entity-map" className="h-full w-full">
      <MapContainer center={BANDUNG} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  )
}
