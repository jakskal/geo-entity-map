import { useCreateEntity } from '../../api/entities'
import type { Location } from './entity'
import { EntityForm } from './EntityForm'

/** Side panel with the form for a new Entity, starting at the given Location. */
export function CreateEntityPanel({
  location,
  onClose,
}: {
  location: Location
  onClose: () => void
}) {
  const createEntity = useCreateEntity()

  return (
    <aside className="absolute top-4 right-4 z-[1000] max-h-[calc(100%-2rem)] w-96 overflow-y-auto rounded bg-white p-4 shadow-lg">
      <EntityForm
        title="New Entity"
        initialValues={{
          name: '',
          type: '',
          status: '',
          latitude: location.latitude,
          longitude: location.longitude,
          description: '',
          attributes: [],
        }}
        onSubmit={async (input) => {
          await createEntity.mutateAsync(input)
          onClose()
        }}
        onCancel={onClose}
      />
    </aside>
  )
}
