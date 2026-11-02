# 02: Frontend skeleton

**Area:** frontend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** A runnable React + TypeScript app showing a full-screen OpenStreetMap map, with the plumbing later frontend tickets build on: server-state handling, a typed API client, and a test harness that renders the app against a fake API. No Entity features yet.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Vite + React 19 + TypeScript 7 project with exact pinned versions; if TypeScript 7 breaks a needed tool, use the newest 6.x and add a row to `docs/log.md` saying why
- [x] Tailwind set up; folder layout by feature as in the spec (API module, Entities feature module, shared components)
- [x] Full-screen react-leaflet map with OpenStreetMap tiles and attribution, centred on Bandung
- [x] TanStack Query provider in place
- [x] API client: JSON fetch helper for `/api`; non-2xx responses become a typed error carrying status, `error` code, `message`, per-field errors (for 422) and the request ID (from the `X-Request-ID` header or the body's `requestId`)
- [x] Vite dev server proxies `/api` to the backend (default `http://localhost:8080`)
- [x] Test harness: Vitest + Testing Library + MSW; a helper renders the app with fresh query state and MSW handlers per test
- [x] Tests: app renders the map container; API client turns a 422 response into a typed error with field errors and request ID
- [x] Multi-stage Dockerfile: builds the app, serves it with a static web server that also forwards `/api` to the backend service
- [x] `frontend/AGENTS.md` (layout, commands for dev/test/build/lint, conventions: TanStack Query for server state, `useState` for UI state, zod for validation) and `frontend/CLAUDE.md` containing only `@AGENTS.md` plus the do-not-edit note
- [x] One test command runs the whole frontend suite
