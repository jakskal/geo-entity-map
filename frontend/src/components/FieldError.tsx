/**
 * Error text under a form field. Give the field `aria-describedby={id}` so
 * screen readers (and tests) read the message as the field's description.
 */
export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  )
}
