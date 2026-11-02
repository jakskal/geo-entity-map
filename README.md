# Geo Entity Map

A web app to display and manage geo-located **Entities** (vehicles, IoT devices, facilities, …) on a map. Operators see every Entity as a marker coloured by Status with an icon per Entity Type, filter them, open their details, and create, edit, move (by dragging) and delete them.

| Part | Stack |
|---|---|
| Frontend | React 19 + TypeScript, Vite, react-leaflet (OpenStreetMap), TanStack Query, react-hook-form + zod, Tailwind (`frontend/`) |
| Backend | Go 1.27 REST API: stdlib `net/http`, pgx, sqlc, goose, `log/slog` (`backend/`) |
| Database | PostgreSQL 18 |

Domain terms: [`GLOSSARY.md`](GLOSSARY.md). Spec: [`docs/features/entity-management/spec.md`](docs/features/entity-management/spec.md). Every decision with its reason: [`docs/log.md`](docs/log.md).

## Run with Docker

Needs only Docker. From the repo root:

```sh
docker compose up --build
```

Then open <http://localhost:3000>. This starts PostgreSQL, the backend and the frontend. The frontend's nginx forwards `/api` to the backend, so the browser talks to one origin. On first start the backend loads 10 sample Entities around Bandung.

No `.env` is needed. To change the port, database credentials or seeding, copy `.env.example` to `.env`. Stop with `docker compose down` (add `-v` to delete the database volume).

## Run locally (without Docker for the apps)

Needs Go 1.27.3, Node 26.13.0 and a PostgreSQL database. For example, start one with Docker:

```sh
docker run -d --name entities-db -p 5432:5432 \
  -e POSTGRES_USER=entities -e POSTGRES_PASSWORD=entities -e POSTGRES_DB=entities \
  postgres:18.6-alpine3.24
```

| Step | Directory | Command |
|---|---|---|
| Backend (port 8080; migrations run on startup) | `backend/` | `DATABASE_URL=postgres://entities:entities@localhost:5432/entities?sslmode=disable SEED=true go run ./cmd/api` |
| Frontend install | `frontend/` | `npm ci` |
| Frontend dev server (proxies `/api` to `http://localhost:8080`; override with `API_PROXY_TARGET`) | `frontend/` | `npm run dev` |

Backend environment: `DATABASE_URL` (required), `PORT` (default `8080`), `SEED` (default `false`).

## Tests

| What | Directory | Command |
|---|---|---|
| Backend: whole suite, through HTTP against a real PostgreSQL (testcontainers-go, needs Docker) | `backend/` | `go test ./...` |
| Frontend: Vitest + Testing Library, MSW fakes the API | `frontend/` | `npm test` |
| Frontend typecheck / lint / build | `frontend/` | `npm run typecheck` / `npm run lint` / `npm run build` |

There is one test seam: the HTTP API contract. Backend tests send real requests to the real handler and database, with no mocks. Frontend tests render the whole app against a fake API that answers like the Go backend. Map gestures are not automated. They are on the [manual checklist](#manual-test-checklist).

## API

REST JSON under `/api`; full contract in the spec.

| Method | Path | Success |
|---|---|---|
| GET | `/api/entities?type=&status=` | 200, array sorted by name |
| GET | `/api/entities/{id}` | 200 |
| POST | `/api/entities` | 201 |
| PUT | `/api/entities/{id}` (full replace) | 200 |
| DELETE | `/api/entities/{id}` | 204 |

Errors are `{"error", "message", "fields"?, "requestId"}`: 400 for malformed JSON, 404 for an unknown id, 422 for validation errors (with per-field reasons) and invalid filters, and 500 with a generic message. Every response carries an `X-Request-ID` header. The server reuses yours or generates one, and it appears in every log line and in the frontend's error messages.

## Why these libraries

Condensed from [`docs/log.md`](docs/log.md). The guiding rule (row 13) was simple, conventional code that can be explained in an interview.

| Area | Choice | Why | Rejected |
|---|---|---|---|
| Database | PostgreSQL, plain lat/lng columns | Familiar, realistic, runs in Docker; one point per Entity needs no PostGIS | SQLite, PostGIS |
| Go HTTP | stdlib `net/http` router | Go 1.22+ method/path routing covers five endpoints | chi, Gin, Echo |
| Go data access | pgx + sqlc + goose | Plain SQL with generated type-safe code, versioned migrations embedded in the binary; no ORM magic | GORM |
| Go validation | Hand-written | Exact per-field error messages matching the frontend | go-playground/validator |
| Go logging | `log/slog` JSON | Standard library; carries the request ID on every line | OpenTelemetry (overkill) |
| Backend tests | testcontainers-go, real PostgreSQL | Tests prove real behaviour incl. SQL and survive refactors | Mocked layers |
| Map | react-leaflet + OpenStreetMap | No API key for reviewers; simple for points | MapLibre GL, Google Maps, Mapbox |
| Server state | TanStack Query | All app state is server data; cache keeps map, list and details in sync | Redux, Zustand |
| Forms / validation | react-hook-form + zod | zod mirrors the backend rules; backend 422 fields are mapped onto form fields | Formik, schema code generation |
| Styling | Tailwind | Utility classes, no component library to learn or explain | MUI, shadcn |
| Frontend tests | Vitest + Testing Library + MSW | Fake API sits exactly at the HTTP seam; no other mocks | E2E tests |
| Build | Vite | Fast, standard React tooling | — |

**Versions:** latest stable, pinned exactly (Go 1.27.3, Node 26.13.0, React 19.3.1, Vite 8.3.5, Tailwind 4.3.3, sqlc 1.31.1, goose 3.29.0, PostgreSQL 18.6). **Deviation:** TypeScript is **6.0.3**, not 7.0.2. The latest typescript-eslint (8.72.1) supports only TypeScript `<6.1.0`, and linting breaks on 7 (log row 31).

## Agentic AI workflow

Built with Claude Code over a fixed sequence of steps. Each step leaves a document in the repo, and `git log` shows the order.

1. **Grilling** (`/grill-with-docs`, two rounds): the AI asked one question at a time and recorded 22 decisions in [`docs/log.md`](docs/log.md) and terms in [`GLOSSARY.md`](GLOSSARY.md).
2. **Spec** (`/to-spec`): [`spec.md`](docs/features/entity-management/spec.md) with 71 user stories, the API contract, testing decisions and Out of Scope.
3. **Tickets** (`/to-tickets`): [12 tickets](docs/features/entity-management/tickets/) in separate backend and frontend lanes so they can be built in parallel against the API contract, plus this integration ticket.
4. **Parallel implementation** (`/implement-spec`): one subagent per ticket, each in its own git worktree, test-first (`/tdd`). Each ticket is one squashed `feat(<area>): … [#NN]` commit on the integration branch `feature/entity-management`. Conflicts between parallel tickets are resolved in `merge: integrate #NN with #MM — …` commits.
5. **Two-axis code review** (`/code-review`): Standards (repo conventions) and Spec (does the code do what the spec says), run in parallel. 21 findings. Fixed in `fix(backend|frontend): address code review findings [review]`. Five were kept with reasons (log row 33).
6. **Integration** (ticket 12): the full stack was run with Docker Compose and the API contract was checked through the frontend's proxy. No mismatches were found, so there are no `fix(integration)` commits.

**Where the developer steered or overrode the AI** (from the Process notes in `docs/log.md`):

- Chose PostgreSQL over the AI's suggestion of SQLite.
- Asked why the AI said "Go 1.22". It turned out to mean the stdlib routing feature, so the project moved to the latest Go 1.27 and dropped chi for the stdlib router.
- Asked what a test "seam" is and whether it meant mocking. This led to one HTTP seam with no backend mocks.
- Proposed an `X-Client: iot-fe` header. The AI advised against it (forgeable without auth), and the developer chose `X-Request-ID` tracing instead.
- Rejected the AI's 8 vertical-slice tickets in favour of 12 tickets in parallel backend/frontend lanes for subagents. Also asked for workflow guards (checklist in `AGENTS.md`) and a commit convention that makes the parallel build readable.
- Chose per-area docs, feature folders, and `AGENTS.md` with `CLAUDE.md` imports so other AI tools can use the same instructions.
- Reviews every ticket's output (log row 13).

Agent instructions: [`AGENTS.md`](AGENTS.md), [`backend/AGENTS.md`](backend/AGENTS.md), [`frontend/AGENTS.md`](frontend/AGENTS.md). Process docs: [`docs/agents/`](docs/agents/).

## Manual test checklist

These are things only a real browser can check. Start the stack with `docker compose up --build` and open <http://localhost:3000>.

1. Seeded Entities appear and the map fits its bounds to show all of them.
2. Marker colour matches Status and marker icon matches Entity Type. The legend explains both.
3. Hovering a marker shows the Entity's name.
4. Clicking a marker opens its details panel and highlights the marker.
5. Clicking empty map opens the create form with that Location filled in. Saving adds the marker.
6. "Add Entity" opens the create form at the map's current centre.
7. Dragging a marker to a new spot saves it. Reload the page and the marker stays at the new Location.
8. A failed drag snaps back: run `docker compose kill backend` (instant; `stop` waits for a graceful shutdown), drag a marker, and check that within a few seconds it returns to its saved Location with an error. Then run `docker compose start backend`.
9. Clicking a row in the side list moves the map to that Entity and selects it.
10. The Entity Type and Status filters change both the list and the markers.
11. Panels (list, details, form, legend) never overlap each other.
12. At a narrow window width (about 375 px), the layout stays usable and the side list collapses.

## Not implemented / out of scope

- **No authentication or authorisation.** The API can be called by any client. A client-identifying header was rejected because it can be forged.
- Single user, no real-time updates (other users' changes appear on reload).
- One point per Entity: no Location history, tracks or shapes (polygons, lines).
- No spatial queries or PostGIS (nearest, within radius, viewport loading).
- No pagination. The list returns every Entity, which is fine at hundreds.
- Hard delete only: no soft delete, undo or audit log.
- No bulk import/export, no per-Entity-Type field schemas (Attributes are free-form).
- No end-to-end browser tests. Map gestures are covered by the manual checklist above.
- No distributed tracing (the request ID covers this one backend), no internationalisation, no mobile-specific layout beyond basic responsiveness.

**Unfinished at submission:** none of the specified features. The manual browser checklist above is to be run by the developer before merging to `main`.
