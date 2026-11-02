import { useCreateEntity } from '../../api/entities'
import { SidePanel } from '../../components/SidePanel'
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
    <SidePanel className="w-96 overflow-y-auto p-4">
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
    </SidePanel>
  )
}
