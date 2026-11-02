import { ApiError, generalMessage, requestIdSuffix } from '../../api/client'

/**
 * Notice that a dragged marker's new Location was not saved (the marker is
 * already back). Placed by the caller in the map's notice region.
 */
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
      ? `${Object.values(error.fields).join('; ')}${requestIdSuffix(error)}`
      : generalMessage(error)

  return (
    <div
      role="alert"
      className="flex max-w-full items-start gap-3 rounded bg-red-50 px-4 py-2 text-sm text-red-700 shadow"
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
