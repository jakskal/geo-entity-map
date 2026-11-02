# 12: Integration check, README and submission

**Area:** both

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** The backend and frontend, built in parallel against the spec's contract, are run together for real and any mismatch is fixed. The README gives a reviewer everything the brief asks for, and the submission is ready to send.

**Blocked by:** 01–11 (all other tickets)

**Status:** ready-for-agent

- [ ] `docker compose up --build` from a clean checkout: seeded Entities appear on the map
- [ ] Every user story in the spec checked by hand through the running stack, including the map gestures not covered by automated tests (click-to-create, dragging markers, marker colours and icons)
- [ ] Every contract mismatch found is fixed in its own `fix(integration): … [#12]` commit
- [ ] Code review (`/code-review`, run by `/implement-spec`) completed on the integration branch and its findings fixed
- [ ] Backend and frontend test suites pass
- [ ] README covers: what the app is; how to run with Docker; how to run backend and frontend locally; test commands; why each library was chosen (compiled from `docs/log.md`); the Agentic AI workflow (grilling → spec → tickets → parallel implementation → review, where the developer overrode the AI, links to `docs/`); the manual test checklist; unfinished and out-of-scope items, including that the API has no authentication
- [ ] Root `AGENTS.md` workflow status updated; every ticket's `Status:` is `done`
- [ ] Integration branch merged into `main` with a `--no-ff` merge summarising the parallel build
- [ ] Submission email drafted for the developer to send (not sent)
