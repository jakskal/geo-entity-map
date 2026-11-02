import { z } from 'zod'
import { ENTITY_TYPES, STATUSES, type EntityInput } from './entity'

// The spec's validation rules, mirrored for immediate feedback in the form.
// The backend checks the same rules again and has the final say.
// Lengths: zod 4.6's string .min()/.max() count Unicode code points, the
// same as the backend's characters (Go runes), so an emoji counts once.
// CreateEntity.test.tsx checks this at the limits.

export const MAX_ATTRIBUTES = 20

/**
 * A fixed-set select that starts empty (''), so a missing choice is reported
 * as an error instead of silently defaulting to the first option.
 */
function requiredChoice<const T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z.union([z.literal(''), z.enum(values)]).pipe(z.enum(values, { error: message }))
}

function coordinate(label: string, limit: number) {
  const range = `${label} must be between -${limit} and ${limit}`
  return z
    .number({ error: `${label} is required` })
    .min(-limit, range)
    .max(limit, range)
}

export const entityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  type: requiredChoice(ENTITY_TYPES, 'Choose an Entity Type'),
  status: requiredChoice(STATUSES, 'Choose a Status'),
  latitude: coordinate('Latitude', 90),
  longitude: coordinate('Longitude', 180),
  description: z.string().max(500, 'Description must be at most 500 characters'),
  // Rows in the form; sent to the API as a name → value map.
  attributes: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, 'Attribute name is required')
          .max(50, 'Attribute name must be at most 50 characters'),
        value: z.string().max(200, 'Attribute value must be at most 200 characters'),
      }),
    )
    .max(MAX_ATTRIBUTES, `At most ${MAX_ATTRIBUTES} Attributes are allowed`)
    // The API takes a name → value map, so a repeated name would silently
    // overwrite the earlier row; flag every repeat instead.
    .superRefine((rows, ctx) => {
      const seen = new Set<string>()
      rows.forEach(({ name }, index) => {
        if (seen.has(name)) {
          ctx.addIssue({ code: 'custom', message: 'Duplicate Attribute name', path: [index, 'name'] })
        }
        seen.add(name)
      })
    }),
})

/** What the form fields hold while the operator edits them. */
export type EntityFormValues = z.input<typeof entityFormSchema>
/** What the form produces once every rule passes. */
export type ValidEntityForm = z.output<typeof entityFormSchema>

/** Converts valid form values into the API's writable Entity fields. */
export function toEntityInput(values: ValidEntityForm): EntityInput {
  return {
    ...values,
    attributes: Object.fromEntries(values.attributes.map(({ name, value }) => [name, value])),
  }
}
