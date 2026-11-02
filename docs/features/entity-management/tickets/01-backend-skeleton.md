# 01: Backend skeleton

**Area:** backend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** A runnable Go backend with everything later backend tickets build on, but no Entity endpoints yet. Starting the server against a PostgreSQL database creates the Entities table, answers the health check, and every request is traced with a request ID and logged as one JSON line. A test harness runs HTTP tests against a throwaway PostgreSQL, so tickets 04 and 05 only add tests and behaviour.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Go module on Go 1.27; package layout by feature as in the spec (program entry point, Entity module, database module)
- [ ] Configuration from environment variables: database URL, port, seed on/off; clear error and exit if the database URL is missing
- [ ] Connects to PostgreSQL with pgx; graceful shutdown on interrupt/terminate
- [ ] goose migrations embedded in the binary and run on startup; the first migration creates the Entities table with the spec's columns, UUID primary key, JSONB Attributes, and CHECK constraints on Entity Type, Status, latitude and longitude ranges
- [ ] sqlc configured to generate query code from plain SQL (at least one query, e.g. a count, to prove the setup works)
- [ ] `GET /healthz` returns 200
- [ ] Request middleware: reuses a non-empty incoming `X-Request-ID` of at most 128 characters, otherwise generates a UUID; always sets it on the response; logs one `log/slog` JSON line per request with request ID, method, path, status, duration
- [ ] A shared JSON error response helper producing the spec's error body (`error`, `message`, optional `fields`, `requestId`); unknown routes return 404 in that shape
- [ ] Test harness: starts PostgreSQL with testcontainers-go, applies migrations, and gives each test a clean Entities table; tests call the real HTTP handler
- [ ] Tests: health check 200; `X-Request-ID` generated when absent, echoed when sent, replaced when over 128 characters; unknown route returns 404 error body including `requestId`
- [ ] Multi-stage Dockerfile producing a small image that runs the server
- [ ] `backend/AGENTS.md` (layout, commands for run/test/sqlc/migrations, conventions, error format) and `backend/CLAUDE.md` containing only `@AGENTS.md` plus the do-not-edit note
- [ ] One test command runs the whole backend suite (requires Docker)
