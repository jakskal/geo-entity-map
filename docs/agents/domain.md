# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root. There is one glossary for the whole repo: an Entity means the same thing in the backend and the frontend.
- **ADRs** that touch the area you're about to work in:
  - `docs/adr/`: cross-cutting decisions that affect both backend and frontend
  - `backend/docs/adr/`: backend-only decisions
  - `frontend/docs/adr/`: frontend-only decisions

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── GLOSSARY.md
├── docs/
│   ├── adr/                  ← decisions affecting both sides
│   ├── features/<slug>/      ← spec.md + tickets/
│   └── log.md                ← decision log
├── backend/
│   └── docs/adr/             ← backend-only decisions
└── frontend/
    └── docs/adr/             ← frontend-only decisions
```

**Where a new ADR goes:** if it affects both sides, `docs/adr/`; if only one side cares, that side's `docs/adr/`.

## Use the glossary's vocabulary

When your output names a domain concept (in a ticket title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
