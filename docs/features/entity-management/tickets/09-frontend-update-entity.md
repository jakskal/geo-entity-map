# 09: Frontend — update an Entity (edit form and dragging markers)

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The operator edits any field of an Entity from its details panel, or drags its marker to move it. Changes show immediately on the map, the list and the details; a failed drag puts the marker back where it was saved.

**Blocked by:** 07 (Frontend — view Entity details), 08 (Frontend — create an Entity with validation)

**Status:** ready-for-agent

- [ ] "Edit" action in the details panel opens the Entity form (from ticket 08) pre-filled with the current values
- [ ] Update mutation sends a full PUT; on success the list and get-one caches are updated and the form closes
- [ ] Server 422 / general errors handled exactly as in create
- [ ] Cancel discards changes
- [ ] Markers are draggable; dropping one sends a full PUT with the new Location
- [ ] If saving a dragged Location fails, the marker returns to its saved Location and an error message (with request ID) is shown
- [ ] MSW handler for update, reusable by later tickets
- [ ] Tests: edit form starts with current values; successful edit updates the details panel; server 422 shows field errors; cancel leaves the Entity unchanged
