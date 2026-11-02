# Decision Log

| # | Decision | Chosen | Why | Rejected |
|---|----------|--------|-----|----------|
| 1 | Entity model | One Entity with a `type` field + optional free-form attributes | Covers every kind of object without repeating CRUD per type | Separate model per type |
| 2 | Location | One current lat/lng point | All the brief needs; fits a 2-day scope | Position history, polygons |
| 3 | Status | Fixed set: active, inactive, maintenance, offline | Easy to validate both sides and colour-code on the map | Free text, per-type sets |
| 4 | Database | PostgreSQL, plain lat/lng columns | Familiar to the developer, realistic, runs in Docker | SQLite (unfamiliar), PostGIS (not needed yet) |
| 5 | Map library | react-leaflet + OpenStreetMap | No API key needed for reviewers; simple for points | MapLibre GL, Google Maps, Mapbox |
| 6 | Map interaction | Click map to create, drag marker to move, click marker for details | Natural map UX; form still has editable lat/lng | Form-only coordinate entry |
| 7 | Scope | No auth, no real-time, single user; add type/status filter sidebar | Not in the brief; filters are cheap and useful | Auth, WebSocket updates |
| 8 | Repo | Public monorepo `frontend/`, `backend/`, `docs/`; English docs | One place to review; English is standard for code | Separate repos |
| 9 | Time budget | ~12 h of work, last ~3 h for docs and submission | Leaves room for polish; deadline is 2 days from receipt | — |
| 10 | Running | `docker compose up` starts DB + backend + frontend | Reviewers need only Docker | Compose for DB only |
| 11 | Validation | Backend is the source of truth; frontend mirrors with zod; per-field error responses | Required by the brief; cheapest way to keep both sides consistent | Unlinked duplicate rules, schema code generation |
| 12 | Tests | Go tests for validation + handlers; frontend form validation tests; no E2E | Covers the explicit requirement at low cost | E2E tests |
| 13 | Code style | Simple and conventional; developer reviews every ticket | Must be explainable in an interview | Clever abstractions |

## Process

- 2026-11-02 — Repo created (`jakskal/geo-entity-map`, public). Grilling round 1 (/grill-with-docs): 13 decisions settled, all on the AI's recommendation; developer confirmed PostgreSQL over SQLite.
