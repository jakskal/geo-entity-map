import { useEntities } from './api/entities'
import { EntityListState } from './features/entities/EntityListState'
import { EntityMap } from './features/entities/EntityMap'
import { MapLegend } from './features/entities/MapLegend'

export function App() {
  const entities = useEntities()

  return (
    <main className="relative h-screen w-screen">
      <EntityMap entities={entities.data ?? []} />
      <EntityListState query={entities} />
      <MapLegend />
    </main>
  )
}
