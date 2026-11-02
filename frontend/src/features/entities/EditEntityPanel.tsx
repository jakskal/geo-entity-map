import { useUpdateEntity } from '../../api/entities'
import type { Entity } from './entity'
import { EntityForm } from './EntityForm'

/** Side panel with the form for changing an Entity, starting with its current values. */
export function EditEntityPanel({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const updateEntity = useUpdateEntity()

  return (
    <aside className="absolute top-4 right-4 z-[1000] max-h-[calc(100%-2rem)] w-96 overflow-y-auto rounded bg-white p-4 shadow-lg">
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
    </aside>
  )
}
