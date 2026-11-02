# Geo Entity Map

Web app to display and manage geo-located Entities on a map. React + TypeScript frontend (`frontend/`), Go backend (`backend/`), PostgreSQL.

Area-specific rules live in `backend/AGENTS.md` and `frontend/AGENTS.md`. Domain terms: `GLOSSARY.md`. Decisions: `docs/log.md`, `docs/adr/`.

## Instruction files

Instructions live in `AGENTS.md` files only. Each `CLAUDE.md` just imports the `AGENTS.md` next to it (`@AGENTS.md`) — never add instructions to a `CLAUDE.md`.

## Workflow status

Check this first in every session; update it when a step finishes.

- [x] Grilling → `GLOSSARY.md`, `docs/log.md`
- [x] Spec → `docs/features/entity-management/spec.md`
- [x] Tickets → `docs/features/entity-management/tickets/` (12 tickets)
- [x] Implementation → run `/implement-spec docs/features/entity-management/spec.md` (includes `/code-review`)
- [x] Ticket 12: integration check, README, merge to `main`
- [ ] Submit by 2026-11-04 10:00 (target 2026-11-03 10:00) (developer sends the email)

## Commit convention

Tickets are built in parallel by agents on one integration branch, then merged to `main`. Commit messages must make that story readable in `git log`.

| Commit | Format | Example |
|---|---|---|
| Ticket work (one squashed commit per ticket) | `feat(<area>): <behaviour> [#NN]` | `feat(backend): create, update, delete Entities with validation [#05]` |
| Merge-conflict resolution between parallel tickets | `merge: integrate #NN with #MM — <what clashed>` | `merge: integrate #11 with #10 — both changed the details panel actions` |
| Integration fixes | `fix(integration): <mismatch> [#12]` | `fix(integration): align frontend error parsing with backend requestId [#12]` |
| Docs / config | `docs: …` / `chore: …` | `docs: add README run instructions [#12]` |
| Final merge to `main` | `--no-ff`, subject `Merge entity-management: …`, body summarising the parallel build | `Merge entity-management: 12 tickets built in parallel by agents, integrated and reviewed` |

- `<area>` is `backend`, `frontend` or `infra`.
- Ticket commit bodies end with `Ticket: docs/features/entity-management/tickets/NN-slug.md`, then the `Co-Authored-By` line.
- Use Glossary vocabulary (Entity, Entity Type, Status, Location, Attributes).

## Agent skills

### Issue tracker

Local markdown: specs and tickets live in `docs/features/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md`; ADRs scoped to `docs/adr/` (cross-cutting), `backend/docs/adr/`, `frontend/docs/adr/`. See `docs/agents/domain.md`.
