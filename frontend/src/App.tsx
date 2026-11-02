import type L from 'leaflet'
import { useRef, useState } from 'react'
import { useEntities, useUpdateEntity } from './api/entities'
import { CreateEntityPanel } from './features/entities/CreateEntityPanel'
import {
  entityToInput,
  type Entity,
  type EntityFilters,
  type Location,
} from './features/entities/entity'
import { EntityDetailsPanel } from './features/entities/EntityDetailsPanel'
import { EntityList } from './features/entities/EntityList'
import { EntityListState } from './features/entities/EntityListState'
import { EntityMap, toLocation } from './features/entities/EntityMap'
import { MapLegend } from './features/entities/MapLegend'
import { MoveEntityError } from './features/entities/MoveEntityError'

/** Zoom used when jumping to an Entity from the list (unless already closer). */
const LIST_SELECT_ZOOM = 16

export function App() {
  // Filters go to the server; the map and the side list render the same result.
  const [filters, setFilters] = useState<EntityFilters>({})
  const entities = useEntities(filters)
  const mapRef = useRef<L.Map>(null)
  // Saves the Location of a dragged marker; its error is shown until dismissed or the next drag.
  const moveEntity = useUpdateEntity()
  // The details panel and the create form share the top-right corner, so at
  // most one is open: opening either closes the other.
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  // Where a new Entity will be created; null while the create form is closed.
  const [newEntityLocation, setNewEntityLocation] = useState<Location | null>(null)

  function selectEntity(id: string) {
    setNewEntityLocation(null)
    setSelectedEntityId(id)
  }

  function selectEntityFromList(entity: Entity) {
    selectEntity(entity.id)
    const map = mapRef.current
    map?.setView([entity.latitude, entity.longitude], Math.max(map.getZoom(), LIST_SELECT_ZOOM))
  }

  function openCreateForm(location: Location) {
    setSelectedEntityId(null)
    setNewEntityLocation(location)
  }

  return (
    <main className="relative h-screen w-screen">
      <EntityMap
        entities={entities.data ?? []}
        mapRef={mapRef}
        selectedEntityId={selectedEntityId}
        onSelectEntity={(entity) => selectEntity(entity.id)}
        onMapClick={openCreateForm}
        onMoveEntity={(entity, location) =>
          moveEntity.mutateAsync({ id: entity.id, input: { ...entityToInput(entity), ...location } })
        }
      />
      {moveEntity.isError && (
        <MoveEntityError
          entityName={moveEntity.variables.input.name}
          error={moveEntity.error}
          onDismiss={moveEntity.reset}
        />
      )}
      <EntityListState query={entities} filtered={Boolean(filters.type || filters.status)} />
      <EntityList
        entities={entities.data ?? []}
        filters={filters}
        onFiltersChange={setFilters}
        selectedEntityId={selectedEntityId}
        onSelectEntity={selectEntityFromList}
      />
      <MapLegend />

      <button
        type="button"
        onClick={() => mapRef.current && openCreateForm(toLocation(mapRef.current.getCenter()))}
        className="absolute right-4 bottom-6 z-[1000] rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
      >
        Add Entity
      </button>
      {selectedEntityId && (
        <EntityDetailsPanel
          key={selectedEntityId}
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
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
