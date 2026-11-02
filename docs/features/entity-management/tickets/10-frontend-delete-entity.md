# 10: Frontend — delete an Entity

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The operator deletes an Entity from its details panel after confirming in an in-app dialog; it disappears from the map, the list and the details at once. A failed delete is reported and the Entity stays.

**Blocked by:** 07 (Frontend — view Entity details)

**Status:** ready-for-agent

- [ ] "Delete" action in the details panel opens an in-app confirmation dialog (not the browser's `confirm()`) naming the Entity
- [ ] Confirming sends DELETE; on success the Entity is removed from the list cache, the selection is cleared and the panel closes
- [ ] Cancelling the dialog does nothing
- [ ] A failure shows an error with the request ID and keeps the Entity
- [ ] MSW handler for delete, reusable by later tickets
- [ ] Tests: confirm deletes and the Entity is gone from the list data; cancel keeps it; server error shows the message with the request ID
