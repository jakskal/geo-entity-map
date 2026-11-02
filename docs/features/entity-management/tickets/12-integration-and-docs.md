# 12: Integration check, README and submission

**Area:** both

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The backend and frontend, built in parallel against the spec's contract, are run together for real and any mismatch is fixed. The README gives a reviewer everything the brief asks for, and the submission is ready to send.

**Blocked by:** 01–11 (all other tickets)

**Status:** done

- [x] `docker compose up --build` from a clean checkout: seeded Entities appear on the map (stack healthy; 10 seeded Entities served at `localhost:3000/api/entities`; map view is checklist item 1)
- [x] Every user story in the spec checked by hand through the running stack, including the map gestures not covered by automated tests (click-to-create, dragging markers, marker colours and icons) — manual checklist in README — run by the developer; all 12 items pass after fixes b02d373, 8d8d121, 7af08a2
- [x] Every contract mismatch found is fixed in its own `fix(integration): … [#12]` commit — none found: list, filters, get, create, update, delete, 400/404/422 bodies and `X-Request-ID` checked with curl through the frontend proxy
- [x] Code review (`/code-review`, run by `/implement-spec`) completed on the integration branch and its findings fixed — fixes in f1e871c, d4ce049, 079d2b2; outcome in `docs/log.md` row 33
- [x] Backend and frontend test suites pass — backend `go test ./...` ok; frontend 52/52 tests, typecheck and lint clean
- [x] README covers: what the app is; how to run with Docker; how to run backend and frontend locally; test commands; why each library was chosen (compiled from `docs/log.md`); the Agentic AI workflow (grilling → spec → tickets → parallel implementation → review, where the developer overrode the AI, links to `docs/`); the manual test checklist; unfinished and out-of-scope items, including that the API has no authentication
- [x] Root `AGENTS.md` workflow status updated; every ticket's `Status:` is `done` — 01–11 are `done`; #12 `done` after the manual check
- [x] Integration branch merged into `main` with a `--no-ff` merge summarising the parallel build — approved by the developer; see the `Merge entity-management: …` commit
- [x] Submission email drafted for the developer to send (not sent) — kept outside the repo for the developer

## Comments

- 2026-11-02 — Developer's manual browser check found: stopping the backend took long; a drag with the backend down waited ~60s before a 502; the move-error notice (bottom) overlapped the map legend and the load-error notice with Retry (top) overlapped the side list at narrow widths.
- Fixed: `stop_grace_period: 3s` for backend and frontend, checklist item 8 now uses `docker compose kill backend`.
- Fixed: nginx proxy timeouts (connect 5s), a 10s client request timeout shown as the general error, and one query retry instead of three (`docs/log.md` row 34).
- Fixed: the map controls are one flow layout (side list at top, shrinking; notice region; legend and "Add Entity" along the bottom), so notices never cover the list or legend; the legend is collapsible below `sm`; side panels are capped to the screen width.
