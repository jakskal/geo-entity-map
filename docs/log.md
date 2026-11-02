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
| 9 | Time budget | ~12 h of work; internal target 2026-11-03 10:00, hard deadline 2026-11-04 10:00 | Keeps a full day of buffer; submit early if done | Working up to the hard deadline |
| 10 | Running | `docker compose up` starts DB + backend + frontend | Reviewers need only Docker | Compose for DB only |
| 11 | Validation | Backend is the source of truth; frontend mirrors with zod; per-field error responses | Required by the brief; cheapest way to keep both sides consistent | Unlinked duplicate rules, schema code generation |
| 12 | Tests | Go tests for validation + handlers; frontend form validation tests; no E2E | Covers the explicit requirement at low cost | E2E tests |
| 13 | Code style | Simple and conventional; developer reviews every ticket | Must be explainable in an interview | Clever abstractions |
| 14 | Entity Types | Fixed set: vehicle, iot_device, facility, other | Per-type map icons, reliable filtering; `other` as escape hatch | Free text |
| 15 | Field rules | name 1–100 (trimmed); type/status in set; lat −90..90, lng −180..180; description ≤500; attributes ≤20 string pairs (key 1–50, value ≤200); names not unique | Same rules both sides; duplicate names are realistic | Unique names |
| 16 | API | REST JSON `/api/entities` (GET list with `?type=&status=`, GET one, POST, PUT full replace, DELETE); 422 with per-field errors | Simple, conventional, easy to test | PATCH, GraphQL, gRPC |
| 17 | Listing | Return all entities, no pagination or viewport loading | Fine at hundreds of entities | Pagination (noted as future work) |
| 18 | IDs / delete | UUIDs, hard delete | Don't expose record counts; no undo needed | Serial ints, soft delete |
| 19 | Go stack | stdlib `net/http` router + pgx + sqlc + goose; hand-written validation | Go 1.22+ routing covers 5 endpoints; plain SQL, no ORM magic; exact per-field errors | chi, Gin/Echo, GORM, go-playground/validator |
| 20 | Go layout | `cmd/api`, `internal/entity`, `internal/db` (by feature) | One feature; service/repository layers would be ceremony | Layered packages, clean architecture |
| 21 | Frontend stack | Vite + TanStack Query + react-hook-form + zod + Tailwind; UI state in `useState` | All state is server data | Redux/Zustand, Formik, MUI/shadcn |
| 22 | Frontend layout | `src/api`, `src/features/entities`, `src/components` | By feature, mirrors backend | Layer-by-type folders |
| 23 | Versions | Latest stable, pinned exactly: Go 1.27.3, Node 26.13.0 LTS, React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Tailwind 4.3.3, sqlc 1.31.1, goose 3.29.0 | Fresh project; older versions add nothing; Go only supports the two newest releases | Go 1.22/1.23 (out of support) |
| 24 | Issue tracker | Local markdown in `docs/features/<feature>/` (`spec.md` + `tickets/NN-slug.md` with `Area:` line); one feature: `entity-management` | Plan lives next to the code and shows in commit history | GitHub Issues, `.scratch/` |
| 25 | Docs layout | Cross-cutting docs at root `docs/`; area docs in `backend/docs/`, `frontend/docs/`; one root glossary | Each side gets its own context; one domain = one glossary | All docs in one folder, per-area glossaries |
| 26 | Agent instructions | `AGENTS.md` holds content at root, `backend/`, `frontend/`; each `CLAUDE.md` is only `@AGENTS.md` | Works for Claude Code and other tools with one source of truth | CLAUDE.md only, symlinks (break on Windows), duplicated content |
| 27 | Test seam | One seam: the HTTP API contract. Backend tested through HTTP against real PostgreSQL (testcontainers-go), no mocks; frontend tested with Vitest + Testing Library against MSW fake API; map gestures checked manually | Tests prove real behaviour incl. SQL; survive refactors; no mock interfaces to explain | Layer-by-layer unit tests with mocks, E2E |

## Process

- 2026-11-02 — Repo created (`jakskal/geo-entity-map`, public). Grilling round 1 (/grill-with-docs): 13 decisions settled, all on the AI's recommendation; developer confirmed PostgreSQL over SQLite.
- 2026-11-02 — Grilling round 2: 9 decisions settled. Developer questioned "Go 1.22" → clarified it named the stdlib routing feature, switched to latest Go 1.27 and dropped chi for the stdlib router. Toolchain installed via gvm/nvm.
- 2026-11-02 — Skills setup (/setup-matt-pocock-skills): developer chose per-area docs, feature folders, and AGENTS.md + CLAUDE.md import so other AI tools can use the instructions.
- 2026-11-02 — Spec (/to-spec): `docs/features/entity-management/spec.md`, 71 user stories. Developer asked what a seam is and whether it meant mocking → agreed on one HTTP seam with no backend mocks.
