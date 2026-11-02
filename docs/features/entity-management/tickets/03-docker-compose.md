# 03: Docker Compose for the whole stack

**Area:** both

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** A reviewer runs one `docker compose up` and gets PostgreSQL, the backend and the frontend running together, opens the browser and sees the map, with `/api` requests reaching the backend through the frontend's web server.

**Blocked by:** 01 (Backend skeleton), 02 (Frontend skeleton)

**Status:** ready-for-agent

- [ ] Compose file at the repo root with three services: PostgreSQL (latest stable major, with a health check and a named volume), backend, frontend
- [ ] Backend starts only after PostgreSQL is healthy; has a health check on `/healthz`; seeding enabled
- [ ] Frontend starts only after the backend is healthy; exposed on a documented port
- [ ] Browser talks to one origin: `/api` is forwarded by the frontend container, no CORS needed
- [ ] `.env.example` documents every variable; Compose works without a `.env` file
- [ ] Verified: `docker compose up --build` from a clean checkout serves the map; a request to `/api/...` through the frontend port reaches the backend (e.g. an unknown API route returns the backend's 404 error body with `X-Request-ID`)
- [ ] Short "Run with Docker" note added to the README (full README is ticket 12)
