import { useUpdateEntity } from '../../api/entities'
import { SidePanel } from '../../components/SidePanel'
import type { Entity } from './entity'
import { EntityForm } from './EntityForm'

/** Side panel with the form for changing an Entity, starting with its current values. */
export function EditEntityPanel({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const updateEntity = useUpdateEntity()

  return (
    <SidePanel className="w-96 overflow-y-auto p-4">
      <EntityForm
        title="Edit Entity"
        initialValues={{
          name: entity.name,
          type: entity.type,
          status: entity.status,
          latitude: entity.latitude,
          longitude: entity.longitude,
          description: entity.description ?? '',
          attributes: Object.entries(entity.attributes ?? {}).map(([name, value]) => ({
            name,
            value,
          })),
        }}
        onSubmit={async (input) => {
          await updateEntity.mutateAsync({ id: entity.id, input })
          onClose()
        }}
        onCancel={onClose}
      />
    </SidePanel>
  )
}
