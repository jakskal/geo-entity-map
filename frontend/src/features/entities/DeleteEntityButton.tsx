import { useId, useState } from 'react'
import { requestIdSuffix } from '../../api/client'
import { useDeleteEntity } from '../../api/entities'
import type { Entity } from './entity'

/**
 * "Delete" action for the details panel. It asks for confirmation in an
 * in-app dialog (not the browser's `confirm()`); `onDeleted` runs once the
 * Entity is deleted (or was already gone). A failure is shown in the dialog
 * and the Entity stays.
 */
export function DeleteEntityButton({ entity, onDeleted }: { entity: Entity; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const deleteEntity = useDeleteEntity()

  function cancel() {
    deleteEntity.reset()
    setConfirming(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded border border-red-600 px-3 py-1 text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
      {confirming && (
        <ConfirmDeleteDialog
          entityName={entity.name}
          isDeleting={deleteEntity.isPending}
          error={deleteEntity.error}
          onConfirm={() => deleteEntity.mutate(entity.id, { onSuccess: onDeleted })}
          onCancel={cancel}
        />
      )}
    </>
  )
}

function ConfirmDeleteDialog({
  entityName,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: {
  entityName: string
  isDeleting: boolean
  error: Error | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => event.key === 'Escape' && onCancel()}
        className="w-80 rounded bg-white p-4 text-sm shadow-lg"
      >
        <h2 id={titleId} className="text-base font-semibold break-words">
          Delete {entityName}?
        </h2>
        <p className="mt-2">This Entity will be removed permanently.</p>
        {error && (
          <p role="alert" className="mt-2 text-red-700">
            Could not delete this Entity{requestIdSuffix(error)}.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded px-3 py-1 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
