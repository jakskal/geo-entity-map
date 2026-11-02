import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, type FieldPath, type UseFormSetError } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { FieldError } from '../../components/FieldError'
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPES,
  STATUS_LABELS,
  STATUSES,
  type EntityInput,
} from './entity'
import {
  entityFormSchema,
  toEntityInput,
  type EntityFormValues,
  type ValidEntityForm,
} from './entitySchema'

const INPUT =
  'mt-1 block w-full rounded border border-gray-300 px-2 py-1 aria-invalid:border-red-500'
const LABEL = 'block text-sm font-medium'

type EntityFormProps = {
  /** Heading and accessible name of the form, e.g. "New Entity". */
  title: string
  initialValues: EntityFormValues
  /** Saves the Entity; reject with an ApiError to show the server's errors. */
  onSubmit: (input: EntityInput) => Promise<unknown>
  onCancel: () => void
}

/**
 * The create/edit form for one Entity. It checks the spec's rules as the
 * operator types and maps the server's 422 `fields` onto the matching inputs.
 */
export function EntityForm({ title, initialValues, onSubmit, onCancel }: EntityFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntityFormValues, unknown, ValidEntityForm>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  })
  const attributes = useFieldArray({ control, name: 'attributes' })

  const save = handleSubmit(async (values) => {
    try {
      await onSubmit(toEntityInput(values))
    } catch (error) {
      showServerError(error, setError)
    }
  })

  // Props that tie an input to its error text for screen readers and tests.
  const describedBy = (id: string, message: string | undefined) => ({
    id,
    'aria-invalid': message ? true : undefined,
    'aria-describedby': message ? `${id}-error` : undefined,
  })

  const attributesError = errors.attributes?.root?.message ?? errors.attributes?.message

  return (
    <form
      aria-labelledby="entity-form-title"
      onSubmit={save}
      noValidate
      className="space-y-3"
    >
      <h2 id="entity-form-title" className="text-lg font-semibold">
        {title}
      </h2>

      <div>
        <label htmlFor="entity-name" className={LABEL}>
          Name
        </label>
        <input
          {...register('name')}
          {...describedBy('entity-name', errors.name?.message)}
          className={INPUT}
        />
        <FieldError id="entity-name-error" message={errors.name?.message} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="entity-type" className={LABEL}>
            Entity Type
          </label>
          <select
            {...register('type')}
            {...describedBy('entity-type', errors.type?.message)}
            className={INPUT}
          >
            <option value="">Choose…</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {ENTITY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <FieldError id="entity-type-error" message={errors.type?.message} />
        </div>
        <div className="flex-1">
          <label htmlFor="entity-status" className={LABEL}>
            Status
          </label>
          <select
            {...register('status')}
            {...describedBy('entity-status', errors.status?.message)}
            className={INPUT}
          >
            <option value="">Choose…</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <FieldError id="entity-status-error" message={errors.status?.message} />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="entity-latitude" className={LABEL}>
            Latitude
          </label>
          <input
            type="number"
            step="any"
            {...register('latitude', { valueAsNumber: true })}
            {...describedBy('entity-latitude', errors.latitude?.message)}
            className={INPUT}
          />
          <FieldError id="entity-latitude-error" message={errors.latitude?.message} />
        </div>
        <div className="flex-1">
          <label htmlFor="entity-longitude" className={LABEL}>
            Longitude
          </label>
          <input
            type="number"
            step="any"
            {...register('longitude', { valueAsNumber: true })}
            {...describedBy('entity-longitude', errors.longitude?.message)}
            className={INPUT}
          />
          <FieldError id="entity-longitude-error" message={errors.longitude?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="entity-description" className={LABEL}>
          Description
        </label>
        <textarea
          rows={3}
          {...register('description')}
          {...describedBy('entity-description', errors.description?.message)}
          className={INPUT}
        />
        <FieldError id="entity-description-error" message={errors.description?.message} />
      </div>

      <fieldset aria-describedby={attributesError ? 'entity-attributes-error' : undefined}>
        <legend className={LABEL}>Attributes</legend>
        <ul className="space-y-2">
          {attributes.fields.map((field, index) => {
            const rowErrors = errors.attributes?.[index]
            const number = index + 1
            return (
              <li key={field.id}>
                <div className="flex gap-2">
                  <input
                    aria-label={`Attribute ${number} name`}
                    placeholder="Name"
                    {...register(`attributes.${index}.name`)}
                    {...describedBy(`entity-attribute-${index}-name`, rowErrors?.name?.message)}
                    className={INPUT}
                  />
                  <input
                    aria-label={`Attribute ${number} value`}
                    placeholder="Value"
                    {...register(`attributes.${index}.value`)}
                    {...describedBy(`entity-attribute-${index}-value`, rowErrors?.value?.message)}
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => attributes.remove(index)}
                    aria-label={`Remove Attribute ${number}`}
                    className="mt-1 rounded px-2 text-gray-500 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>
                <FieldError
                  id={`entity-attribute-${index}-name-error`}
                  message={rowErrors?.name?.message}
                />
                <FieldError
                  id={`entity-attribute-${index}-value-error`}
                  message={rowErrors?.value?.message}
                />
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={() => attributes.append({ name: '', value: '' })}
          className="mt-2 text-sm text-blue-700 hover:underline"
        >
          Add Attribute
        </button>
        <FieldError id="entity-attributes-error" message={attributesError} />
      </fieldset>

      {errors.root?.server && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.server.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

/** Form fields the backend can name in a 422 `fields` map. */
const SERVER_FIELDS = ['name', 'type', 'status', 'latitude', 'longitude', 'description'] as const

/**
 * Shows a failed save: each 422 field reason next to its field, anything
 * else as one general message with the request ID.
 */
function showServerError(error: unknown, setError: UseFormSetError<EntityFormValues>) {
  if (error instanceof ApiError && error.status === 422) {
    const unmatched: string[] = []
    for (const [field, reason] of Object.entries(error.fields)) {
      const target = formFieldFor(field)
      if (target) setError(target, { type: 'server', message: reason })
      else unmatched.push(reason)
    }
    if (unmatched.length === 0 && Object.keys(error.fields).length > 0) return
  }
  setError('root.server', { type: 'server', message: generalMessage(error) })
}

function formFieldFor(field: string): FieldPath<EntityFormValues> | undefined {
  if ((SERVER_FIELDS as readonly string[]).includes(field)) {
    return field as (typeof SERVER_FIELDS)[number]
  }
  // Attributes are a map on the server, so any attribute problem
  // (e.g. "attributes" or "attributes.plate") is shown under the editor.
  if (field === 'attributes' || field.startsWith('attributes.') || field.startsWith('attributes[')) {
    return 'attributes'
  }
  return undefined
}

/** A failed request as one message for the operator, with the request ID when known. */
export function generalMessage(error: unknown): string {
  if (error instanceof ApiError && error.requestId) {
    return `Something went wrong (request id: ${error.requestId})`
  }
  return 'Something went wrong. Please try again.'
}
