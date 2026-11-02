# Geo Entity Map

A web app to display and manage geo-located entities (vehicles, IoT devices, facilities, …) on a map.

- **Frontend:** React + TypeScript
- **Backend:** Go

> Work in progress — setup instructions, library rationale, and the Agentic AI workflow will be documented here.

## Run with Docker

Needs only Docker. From the repo root:

```sh
docker compose up --build
```

Then open <http://localhost:3000>. This starts PostgreSQL, the backend and the frontend; the frontend's nginx forwards `/api` to the backend, and the backend loads sample Entities on first start. No `.env` is needed — copy `.env.example` to `.env` to change the port or database credentials. Stop with `docker compose down` (add `-v` to delete the database volume).
