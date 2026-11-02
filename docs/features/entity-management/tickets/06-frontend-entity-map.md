# 06: Frontend — see Entities on the map

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The operator opens the app and sees every Entity as a marker at its Location, coloured by Status and with an icon per Entity Type, with a legend, the map fitted to all Entities, and clear loading, error and empty states. Built against the spec's API contract using MSW.

**Blocked by:** 02 (Frontend skeleton)

**Status:** ready-for-agent

- [ ] Entity, Entity Type and Status TypeScript types matching the spec's API contract
- [ ] TanStack Query hook for the Entity list (accepting optional Entity Type / Status filters for ticket 11)
- [ ] One marker per Entity; colour by Status, icon by Entity Type; hovering shows the name
- [ ] Legend explaining colours and icons
- [ ] Map fits all Entities into view on first load (stays on Bandung when there are none)
- [ ] Loading indicator; error message with a retry action that refetches; empty-state hint explaining how to create the first Entity
- [ ] MSW handlers for the list endpoint, reusable by later tickets
- [ ] Tests: loading state shown; error state shown and retry refetches; empty-state hint shown for `[]`; legend lists every Entity Type and Status
