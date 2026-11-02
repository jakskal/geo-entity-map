// The Entity model as the backend's API returns it (see the spec's API contract).

export const ENTITY_TYPES = ['vehicle', 'iot_device', 'facility', 'other'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const STATUSES = ['active', 'inactive', 'maintenance', 'offline'] as const
export type Status = (typeof STATUSES)[number]

export type Entity = {
  id: string
  name: string
  type: EntityType
  status: Status
  latitude: number
  longitude: number
  description?: string
  attributes?: Record<string, string>
  /** RFC 3339 UTC, server-assigned. */
  createdAt: string
  /** RFC 3339 UTC, server-assigned. */
  updatedAt: string
}

/** Optional list filters; each maps to the list endpoint's query parameter. */
export type EntityFilters = {
  type?: EntityType
  status?: Status
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  vehicle: 'Vehicle',
  iot_device: 'IoT device',
  facility: 'Facility',
  other: 'Other',
}

export const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
  offline: 'Offline',
}

/** The writable fields sent when creating or updating an Entity. */
export type EntityInput = {
  name: string
  type: EntityType
  status: Status
  latitude: number
  longitude: number
  description: string
  attributes: Record<string, string>
}

/** A Location as latitude and longitude. */
export type Location = {
  latitude: number
  longitude: number
}
