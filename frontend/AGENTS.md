# Frontend

React 19 + TypeScript + Vite single-page app: a full-screen react-leaflet map of Entities, talking to the Go backend over `/api`. Read the spec (`docs/features/entity-management/spec.md`) and `GLOSSARY.md` first.

## Layout

```
src/
├── api/                 API module: fetch client (client.ts), TanStack Query hooks
├── features/entities/   Entities feature: map, markers, list, filters, details, form, zod schema
├── components/          Shared UI pieces (buttons, panels, field error text)
├── test/                Test harness: MSW server, setup, renderApp helper
├── App.tsx              Page layout
├── AppProviders.tsx     QueryClientProvider (tests pass their own QueryClient)
└── main.tsx             Entry point
```

Tests sit next to the code they cover as `*.test.ts(x)`.

## Commands

Run from `frontend/` with Node 26 (`nvm use 26.13.0`).

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server (proxies `/api` to `http://localhost:8080`; override with `API_PROXY_TARGET`) | `npm run dev` |
| All tests, once | `npm test` |
| Tests in watch mode | `npm run test:watch` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Production build | `npm run build` |

Docker: `Dockerfile` builds the app and serves it with nginx, which forwards `/api` to `BACKEND_URL` (default `http://backend:8080`).

## Conventions

- **Server state: TanStack Query.** Every API read is a query, every write a mutation; mutations update the query cache so map, list and details agree. Never copy server data into `useState`.
- **UI state: `useState`** in the component that owns it (selected Entity, filters, form open, pending map-click Location). No global state library.
- **Validation: zod** schema mirroring the backend rules in the spec; forms use react-hook-form with it. The backend is the source of truth: always show its 422 `fields` next to the matching form field.
- **API calls go through `apiFetch`** in `src/api/client.ts`. It throws `ApiError` (`status`, `code`, `message`, `fields`, `requestId`) for any non-2xx response. General error messages show `requestId`, e.g. "Something went wrong (request id: …)". The frontend never generates request IDs.
- **Styling: Tailwind** utility classes. No component library.
- **Dependencies are pinned exactly** (`.npmrc` has `save-exact=true`).
- Use Glossary vocabulary in code and test names: Entity, Entity Type, Status, Location, Attributes.

## Testing

- The one seam is the HTTP API. Tests render the real app with `renderApp({ handlers })` from `src/test/renderApp.tsx` and let MSW play the backend at `/api`, answering like the Go API (including 422 bodies with `fields` and `requestId`). No other mocks.
- Each test gets a fresh QueryClient (no retries) and its own handlers; handlers are reset after every test. A request with no handler fails the test.
- Leaflet's map gestures (click-to-create, marker drag, marker colours/icons) are not automated; they are on the README's manual checklist.
- TypeScript is 6.0.x, not 7: see `docs/log.md` (typescript-eslint does not support 7 yet).
