import { useState } from 'react'
import { useEntities } from './api/entities'
import { EntityDetailsPanel } from './features/entities/EntityDetailsPanel'
import { EntityListState } from './features/entities/EntityListState'
import { EntityMap } from './features/entities/EntityMap'
import { MapLegend } from './features/entities/MapLegend'

export function App() {
  const entities = useEntities()
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  return (
    <main className="relative h-screen w-screen">
      <EntityMap
        entities={entities.data ?? []}
        selectedEntityId={selectedEntityId}
        onSelectEntity={(entity) => setSelectedEntityId(entity.id)}
      />
      <EntityListState query={entities} />
      <MapLegend />
      {selectedEntityId && (
        <EntityDetailsPanel
          key={selectedEntityId}
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
    </main>
  )
}
