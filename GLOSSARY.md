# Geo Entity Map

Tracking and managing real-world objects that have a geographic position, shown on a map.

## Language

**Entity**:
A real-world object with a geographic position that the app tracks, such as a vehicle, an IoT device, or a facility.
_Avoid_: Object, item, asset, marker

**Entity Type**:
The kind of real-world object an Entity represents (e.g. vehicle, IoT device, facility).
_Avoid_: Category, kind, class

**Status**:
The operational condition of an Entity, chosen from one fixed set shared by all Entity Types: active, inactive, maintenance, offline.
_Avoid_: State, condition, health

**Location**:
The single current geographic point of an Entity, given as latitude and longitude.
_Avoid_: Position, coordinates, address, place

**Attributes**:
Optional free-form name–value details about an Entity that are specific to its Entity Type (e.g. a vehicle's plate number).
_Avoid_: Properties, metadata, extra fields
