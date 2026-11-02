import { useId, useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { useEntity } from '../../api/entities'
import { DeleteEntityButton } from './DeleteEntityButton'
import { EditEntityPanel } from './EditEntityPanel'
import { ENTITY_TYPE_LABELS, STATUS_LABELS, type Entity } from './entity'

const timestampFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** An RFC 3339 timestamp as a readable date and time in the operator's time zone. */
export function formatTimestamp(iso: string): string {
  return timestampFormat.format(new Date(iso))
}

/** Side panel with everything recorded about the selected Entity. */
export function EntityDetailsPanel({ entityId, onClose }: { entityId: string; onClose: () => void }) {
  const entity = useEntity(entityId)
  const titleId = useId()
  // While editing, the edit form takes the panel's place; closing it shows the details again.
  const [editing, setEditing] = useState(false)

  if (editing && entity.data) {
    return <EditEntityPanel entity={entity.data} onClose={() => setEditing(false)} />
  }

  return (
    <section
      aria-labelledby={titleId}
      className="absolute top-4 right-4 z-[1000] flex max-h-[calc(100%-2rem)] w-80 flex-col rounded bg-white text-sm shadow-lg"
    >
      <header className="flex items-start justify-between gap-2 border-b p-4">
        <h2 id={titleId} className="text-base font-semibold break-words">
          {entity.data?.name ?? 'Entity details'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded px-2 text-lg leading-none text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </header>

      <div className="overflow-y-auto p-4">
        {entity.isPending && <p role="status">Loading…</p>}
        {entity.isError && <DetailsError error={entity.error} />}
        {entity.data && <EntityFields entity={entity.data} />}
      </div>

      {/* Actions for the shown Entity: Edit (ticket 09) and Delete (ticket 10) go here. */}
      {entity.data && (
        <div role="group" aria-label="Actions" className="flex gap-2 border-t p-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
          >
            Edit
          </button>
          {/* Deleting closes the panel, which clears the selection. */}
          <DeleteEntityButton entity={entity.data} onDeleted={onClose} />
        </div>
      )}
    </section>
  )
}

function DetailsError({ error }: { error: Error }) {
  if (error instanceof ApiError && error.status === 404) {
    return <p role="alert">This Entity no longer exists.</p>
  }
  const requestId = error instanceof ApiError ? error.requestId : undefined
  return (
    <p role="alert" className="text-red-700">
      Could not load this Entity{requestId ? ` (request id: ${requestId})` : ''}.
    </p>
  )
}

function EntityFields({ entity }: { entity: Entity }) {
  const attributes = Object.entries(entity.attributes ?? {})

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      <Field label="Entity Type">{ENTITY_TYPE_LABELS[entity.type]}</Field>
      <Field label="Status">{STATUS_LABELS[entity.status]}</Field>
      <Field label="Latitude">{entity.latitude}</Field>
      <Field label="Longitude">{entity.longitude}</Field>
      <Field label="Description">{entity.description || '—'}</Field>
      <Field label="Attributes">
        {attributes.length === 0 ? (
          '—'
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-2">
            {attributes.map(([name, value]) => (
              <div key={name} className="contents">
                <dt className="text-gray-500">{name}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Field>
      <Field label="Created">{formatTimestamp(entity.createdAt)}</Field>
      <Field label="Updated">{formatTimestamp(entity.updatedAt)}</Field>
    </dl>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="break-words whitespace-pre-line">{children}</dd>
    </>
  )
}
