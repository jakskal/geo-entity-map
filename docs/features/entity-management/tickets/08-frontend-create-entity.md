# 08: Frontend — create an Entity with validation

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The operator clicks an empty spot on the map (or the "Add Entity" button) and a form opens with the Location pre-filled. The form checks every rule as they type, shows the server's per-field errors when it rejects input, and the new Entity appears on the map as soon as it is saved. The form is built to be reused for editing in ticket 09.

**Blocked by:** 06 (Frontend — see Entities on the map)

**Status:** done

- [x] zod schema mirroring every rule in the spec's validation table
- [x] Entity form with react-hook-form: name, Entity Type and Status (fixed selects), latitude, longitude, description, and an Attributes editor (add / edit / remove name-value rows)
- [x] The form takes initial values and a submit handler, so ticket 09 can reuse it for editing
- [x] Clicking empty map opens the form with the clicked latitude/longitude; "Add Entity" button opens it at the current map centre
- [x] Create mutation posts the Entity; on success the form closes and the list query cache is updated so the marker appears immediately
- [x] A 422 response maps each `fields` entry onto the matching form field; any other failure shows a general message including the request ID
- [x] Save button disabled while saving; Cancel closes without saving
- [x] MSW handler for create, reusable by later tickets
- [x] Tests: invalid input blocked with field messages (empty name, latitude 91, more than 20 Attributes, Attribute name too long); successful create closes the form and the new Entity is in the list data; server 422 shows errors on the right fields; server 500 shows the general message with the request ID
