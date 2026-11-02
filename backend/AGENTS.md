# Backend

Go 1.27 REST API for Entities. Stdlib `net/http` router, pgx, sqlc, goose, `log/slog`. Source of truth for the API contract and validation rules: `docs/features/entity-management/spec.md`.

## Layout

| Path | What lives there |
|---|---|
| `cmd/api` | Program entry point: config from env, connect, migrate, serve, graceful shutdown |
| `internal/app` | `NewHandler(pool, logger)`: the complete handler (`/healthz`, `/api/` → Entity module, 404 fallback, middleware). The server runs it; tests call it |
| `internal/entity` | The Entity module: model, validation, handlers, store. `NewHandler(pool)` serves everything under `/api/` |
| `internal/db` | `migrations/` (goose, embedded in the binary), `queries/` (SQL for sqlc), and sqlc-generated code (`db.go`, `models.go`, `*.sql.go` — do not edit) |
| `internal/httpx` | Shared HTTP plumbing: request ID + request logging middleware, JSON error helpers |
| `internal/testdb` | Test harness: throwaway PostgreSQL via testcontainers-go, migrated, clean Entities table per test |

## Commands (run from `backend/`)

| Task | Command |
|---|---|
| Run | `DATABASE_URL=postgres://user:pass@localhost:5432/entities?sslmode=disable go run ./cmd/api` |
| Test (whole suite, needs Docker) | `go test ./...` |
| Regenerate query code | `sqlc generate` (sqlc 1.31.1, config `sqlc.yaml`) |
| New migration | `goose -dir internal/db/migrations create <name> sql` (goose 3.29.0); migrations run automatically on startup |
| Build image | `docker build -t geo-entity-map-backend .` |

Environment: `DATABASE_URL` (required), `PORT` (default `8080`), `SEED` (`true`/`false`, default `false`).

## Conventions

- Tests go through HTTP only: build the server with `app.NewHandler(testdb.New(t), logger)` and `httptest`, assert on status codes, headers and JSON bodies. No mocks, no direct SQL or internal-function tests. See `internal/app/app_test.go`.
- Entity routes are registered in `entity.NewHandler` with full paths and methods, e.g. `mux.HandleFunc("GET /api/entities/{id}", ...)`. Keep its `/` fallback so unknown `/api` paths return the JSON 404.
- SQL lives in `internal/db/queries/*.sql`; after editing it or a migration, run `sqlc generate` and commit the generated code.
- Schema changes are new goose migration files; never edit an applied migration.
- Pin dependency versions exactly. Keep code simple and conventional.
- Use Glossary vocabulary (Entity, Entity Type, Status, Location, Attributes) in names and test names.

## Errors and logging

- Every non-2xx response uses `httpx.WriteError`, producing `{"error", "message", "fields"?, "requestId"}`. Codes: `validation_failed` (422, with `fields`), `bad_request` (400), `not_found` (404, `httpx.NotFound`), `internal` (500, `httpx.InternalError` — logs the cause, returns a generic message).
- `httpx.Middleware` sets `X-Request-ID` on every response (reuses a non-empty incoming value of at most 128 characters, else a new UUID) and logs one JSON line per request: `requestId`, `method`, `path`, `status`, `durationMs`. Successful `GET /healthz` (200) is not logged, because Docker polls it every few seconds; a failing health check is.
- Log inside a request with `httpx.Logger(r.Context())` so the line carries the request ID.
