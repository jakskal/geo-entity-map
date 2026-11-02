import { ApiError } from '../../api/client'
import { generalMessage } from './EntityForm'

/** Notice that a dragged marker's new Location was not saved (the marker is already back). */
export function MoveEntityError({
  entityName,
  error,
  onDismiss,
}: {
  entityName: string
  error: Error
  onDismiss: () => void
}) {
  const reason =
    error instanceof ApiError && error.status === 422 && Object.keys(error.fields).length > 0
      ? `${Object.values(error.fields).join('; ')} (request id: ${error.requestId ?? 'unknown'})`
      : generalMessage(error)

  return (
    <div
      role="alert"
      className="absolute bottom-20 left-1/2 z-[1000] flex -translate-x-1/2 items-start gap-3 rounded bg-red-50 px-4 py-2 text-sm text-red-700 shadow"
    >
      <p>
        Could not move {entityName}: {reason}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded px-1 leading-none hover:bg-red-100"
      >
        ×
      </button>
    </div>
  )
}
