# 07: Frontend — view Entity details

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The operator clicks a marker and a details panel opens showing everything about that Entity, with its marker highlighted. The panel can be closed, and a vanished Entity is reported clearly. The panel is the place later tickets add Edit and Delete actions to.

**Blocked by:** 06 (Frontend — see Entities on the map)

**Status:** done

- [x] Selected Entity held in UI state; clicking a marker selects it
- [x] TanStack Query hook for fetching one Entity
- [x] Details panel shows name, Entity Type, Status, latitude, longitude, description, Attributes (as a name/value list) and created/updated timestamps in a readable local format
- [x] Selected marker visibly highlighted
- [x] Close action clears the selection
- [x] A 404 from the API shows "this Entity no longer exists" and lets the operator close the panel
- [x] Panel has a clearly marked area for actions (Edit / Delete added by tickets 09 and 10)
- [x] MSW handler for get-one, reusable by later tickets
- [x] Tests: selecting an Entity shows all its fields and Attributes; close hides the panel; 404 shows the no-longer-exists message
