# Geo Entity Map

Web app to display and manage geo-located Entities on a map. React + TypeScript frontend (`frontend/`), Go backend (`backend/`), PostgreSQL.

Area-specific rules live in `backend/AGENTS.md` and `frontend/AGENTS.md`. Domain terms: `GLOSSARY.md`. Decisions: `docs/log.md`, `docs/adr/`.

## Instruction files

Instructions live in `AGENTS.md` files only. Each `CLAUDE.md` just imports the `AGENTS.md` next to it (`@AGENTS.md`) — never add instructions to a `CLAUDE.md`.

## Agent skills

### Issue tracker

Local markdown: specs and tickets live in `docs/features/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md`; ADRs scoped to `docs/adr/` (cross-cutting), `backend/docs/adr/`, `frontend/docs/adr/`. See `docs/agents/domain.md`.
