import type L from 'leaflet'
import { useRef, useState } from 'react'
import { useEntities } from './api/entities'
import { CreateEntityPanel } from './features/entities/CreateEntityPanel'
import type { Location } from './features/entities/entity'
import { EntityListState } from './features/entities/EntityListState'
import { EntityMap, toLocation } from './features/entities/EntityMap'
import { MapLegend } from './features/entities/MapLegend'

export function App() {
  const entities = useEntities()
  const mapRef = useRef<L.Map>(null)
  // Where a new Entity will be created; null while the create form is closed.
  const [newEntityLocation, setNewEntityLocation] = useState<Location | null>(null)

  return (
    <main className="relative h-screen w-screen">
      <EntityMap entities={entities.data ?? []} mapRef={mapRef} onMapClick={setNewEntityLocation} />
      <EntityListState query={entities} />
      <MapLegend />

      <button
        type="button"
        onClick={() => mapRef.current && setNewEntityLocation(toLocation(mapRef.current.getCenter()))}
        className="absolute right-4 bottom-6 z-[1000] rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
      >
        Add Entity
      </button>
      {newEntityLocation && (
        <CreateEntityPanel
          // A new map click restarts the form at the new Location.
          key={`${newEntityLocation.latitude},${newEntityLocation.longitude}`}
          location={newEntityLocation}
          onClose={() => setNewEntityLocation(null)}
        />
      )}
    </main>
  )
}
