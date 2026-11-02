# 11: Frontend — Entity list and filters

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** A side list shows every Entity with its name, Entity Type and Status. The operator filters by Entity Type and Status, sees how many match, clears the filters in one action, and clicks a row to move the map to that Entity and open its details. The map and the list always show the same filtered set.

**Blocked by:** 07 (Frontend — view Entity details)

**Status:** done

- [x] Side list of Entities showing name, Entity Type and Status
- [x] Entity Type and Status filters held in UI state and passed to the list query, so filtering happens on the server
- [x] Map and list render the same query result
- [x] Count of Entities currently shown; "Clear filters" resets both filters
- [x] Clicking a row selects the Entity (opening its details) and moves the map to its Location
- [x] Layout works at narrow widths (list collapsible or stacked)
- [x] MSW list handler honours `type` and `status` query parameters
- [x] Tests: list shows Entities from the API; choosing a filter sends it to the API and updates list and count; clear filters restores the full list; clicking a row opens that Entity's details
