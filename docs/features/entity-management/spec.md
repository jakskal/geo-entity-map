# Spec: Entity Management

Status: ready-for-agent
Feature: entity-management
Area: both

## Problem Statement

An operator needs to keep track of real-world objects that have a geographic position — vehicles, IoT devices, facilities — and see where they are. Today there is nothing: no place to record an Entity, no way to see Entities on a map, and no guarantee that what gets recorded is valid (a latitude of 120, an empty name, an unknown Status). The operator wants to look at a map, see every Entity at its Location, inspect any one of them, and add, change, move or remove Entities without leaving the map — and trust that bad input is rejected with a clear explanation.

A reviewer evaluating this take-home additionally needs to run the whole application with minimal setup, understand why each library was chosen, and see how far Agentic AI was used.

## Solution

A web application with a map at its centre. Every Entity appears as a marker at its Location; the marker's colour shows its Status and its icon shows its Entity Type. The operator can:

- click a marker (or a row in the side list) to open the Entity's details;
- click an empty spot on the map to start creating a new Entity there, with the Location pre-filled;
- edit any Entity's fields in a form, or drag its marker to move it;
- delete an Entity after confirming;
- filter what is shown by Entity Type and Status.

Every form validates input as the operator types, and the server validates again and is the final authority; server-side errors are shown next to the field they concern. Data is stored in PostgreSQL behind a Go REST API. One `docker compose up` starts the database, backend and frontend, with a set of sample Entities already loaded so the map is not empty on first run.

## User Stories

### Viewing Entities on the map

1. As an operator, I want to see every Entity as a marker on a map, so that I know where all my objects are.
2. As an operator, I want each marker's colour to reflect the Entity's Status, so that I can spot offline or maintenance Entities at a glance.
3. As an operator, I want each marker's icon to reflect the Entity's Entity Type, so that I can tell vehicles, IoT devices and facilities apart.
4. As an operator, I want a legend explaining marker colours and icons, so that I don't have to guess what they mean.
5. As an operator, I want the map to fit all Entities into view when it first loads, so that I don't have to search for them.
6. As an operator, I want to pan and zoom the map freely, so that I can look at an area in detail.
7. As an operator, I want to see a loading indicator while Entities are being fetched, so that I know the app is working.
8. As an operator, I want to see a clear message when Entities cannot be loaded, with a way to retry, so that a network or server failure isn't silent.
9. As an operator, I want to see an empty-state hint when there are no Entities yet, so that I know how to create the first one.
10. As an operator, I want to hover over a marker and see the Entity's name, so that I can identify it without opening it.

### Listing and filtering

11. As an operator, I want a side list of all Entities showing name, Entity Type and Status, so that I can browse them without hunting on the map.
12. As an operator, I want to filter Entities by Entity Type, so that I can focus on one kind of object.
13. As an operator, I want to filter Entities by Status, so that I can focus on, for example, everything offline.
14. As an operator, I want the map and the list to show the same filtered set, so that the two views never disagree.
15. As an operator, I want to clear all filters in one action, so that I can get back to the full picture quickly.
16. As an operator, I want to click an Entity in the list and have the map move to it and open its details, so that I can jump straight to it.
17. As an operator, I want the list to show a count of the Entities currently shown, so that I know how many match my filters.

### Viewing details

18. As an operator, I want to click a marker and see the Entity's details, so that I can inspect it.
19. As an operator, I want the details to show name, Entity Type, Status, Location (latitude and longitude), description and Attributes, so that I see everything recorded about it.
20. As an operator, I want the details to show when the Entity was created and last updated, so that I know how fresh the information is.
21. As an operator, I want the selected Entity's marker to be visibly highlighted, so that I know which one the details belong to.
22. As an operator, I want to close the details panel, so that I can get back to the full map.
23. As an operator, I want to see a clear message if the Entity I opened no longer exists, so that I am not shown stale data.

### Creating

24. As an operator, I want to click an empty spot on the map to start creating an Entity there, so that placing it is natural.
25. As an operator, I want the form's latitude and longitude to be pre-filled from where I clicked, so that I don't have to type coordinates.
26. As an operator, I want to be able to adjust latitude and longitude by typing, so that I can enter a precise Location.
27. As an operator, I want an "Add Entity" button as an alternative to clicking the map, so that I can create one at the current map centre.
28. As an operator, I want to choose the Entity Type and Status from fixed lists, so that I can't enter an invalid value.
29. As an operator, I want to add an optional description, so that I can note something about the Entity.
30. As an operator, I want to add, edit and remove Attribute name–value pairs, so that I can record type-specific details such as a vehicle's plate number.
31. As an operator, I want the new Entity to appear on the map and in the list as soon as it is saved, so that I get immediate confirmation.
32. As an operator, I want to cancel creating an Entity, so that nothing is saved by accident.
33. As an operator, I want the save button to be disabled while saving, so that I don't create duplicates by clicking twice.

### Updating

34. As an operator, I want to edit any field of an existing Entity from its details, so that I can keep information current.
35. As an operator, I want the edit form to start with the Entity's current values, so that I only change what I need.
36. As an operator, I want to drag an Entity's marker to a new spot to update its Location, so that moving it is quick.
37. As an operator, I want the marker to snap back and show an error if saving a dragged Location fails, so that the map never shows a Location that wasn't saved.
38. As an operator, I want updates to show immediately on the map, in the list and in the details, so that every view stays consistent.
39. As an operator, I want to cancel an edit and keep the original values, so that I can back out of a mistake.

### Deleting

40. As an operator, I want to delete an Entity from its details, so that I can remove objects that no longer exist.
41. As an operator, I want to confirm before an Entity is deleted, so that I don't delete one by accident.
42. As an operator, I want the deleted Entity to disappear from the map, the list and the details immediately, so that I know it is gone.
43. As an operator, I want to see an error if deleting fails, so that I know the Entity still exists.

### Validation

44. As an operator, I want to be told immediately when a required field (name, Entity Type, Status, latitude, longitude) is missing, so that I can fix it before saving.
45. As an operator, I want to be told when the name is longer than 100 characters or only spaces, so that names stay meaningful.
46. As an operator, I want to be told when latitude is outside −90 to 90 or longitude outside −180 to 180, so that I can't record an impossible Location.
47. As an operator, I want to be told when the description is longer than 500 characters, so that I know the limit.
48. As an operator, I want to be told when I add more than 20 Attributes, an Attribute name is empty or longer than 50 characters, or a value is longer than 200 characters, so that Attributes stay manageable.
49. As an operator, I want errors returned by the server to appear next to the field they concern, so that I know exactly what to fix even if the browser's checks were bypassed.
50. As an operator, I want a general error message when saving fails for a reason not tied to a field, so that failures are never silent.
51. As an API client, I want invalid requests rejected with a 422 response listing each invalid field and the reason, so that I can correct my request programmatically.
52. As an API client, I want malformed JSON rejected with a 400 response, so that I can tell a syntax problem from a validation problem.
53. As an API client, I want requests for an unknown or malformed Entity id to return 404, so that I can handle missing Entities.
54. As an API client, I want an invalid Entity Type or Status in a list filter rejected with 422, so that typos don't silently return an empty list.
55. As an API client, I want unexpected server failures to return 500 with a generic message, so that internal details are not leaked.

### API

56. As an API client, I want to list all Entities, optionally filtered by Entity Type and/or Status, so that I can display them.
57. As an API client, I want to fetch one Entity by id, so that I can show its details.
58. As an API client, I want to create an Entity and receive it back with its server-assigned id and timestamps, so that I can show it immediately.
59. As an API client, I want to replace an Entity's fields with a full update, so that the stored Entity exactly matches what I sent.
60. As an API client, I want to delete an Entity by id, so that it is removed.
61. As an API client, I want the server to ignore any id or timestamps I send in a request body, so that those values can't be forged.
62. As an API client, I want names to be stored with leading and trailing spaces trimmed, so that stored data is clean.

### Running and reviewing

63. As a reviewer, I want to start the whole application with one `docker compose up`, so that I only need Docker installed.
64. As a reviewer, I want sample Entities loaded on first run, so that I can try every feature immediately.
65. As a reviewer, I want the README to explain how to run the app with Docker and how to run each part locally for development, so that I can choose either way.
66. As a reviewer, I want the README to explain why each library was chosen, so that I can judge the technical decisions.
67. As a reviewer, I want the README to explain how Agentic AI was used and how far, so that I can evaluate the workflow honestly.
68. As a reviewer, I want the README to list anything not finished or deliberately left out, so that I know the boundaries of the submission.
69. As a reviewer, I want to run the backend and frontend test suites with one command each, so that I can verify the code works.
70. As a developer, I want the database schema to be created automatically when the backend starts, so that no manual setup step is needed.
71. As a developer, I want a health endpoint, so that Docker can tell when the backend is ready.

### Request tracing

72. As a developer, I want every API request to carry a unique request ID, so that I can trace one request through the server logs.
73. As an API client, I want the server to reuse the `X-Request-ID` I send, or generate one if I send none, and return it in the response, so that I can correlate my request with the server's logs.
74. As a developer, I want every server log line for a request to include its request ID, method, path, status and duration, so that I can find exactly what happened.
75. As an operator, I want error messages in the app to show the request ID, so that I can report a failure and it can be found in the logs.

## Implementation Decisions

### Domain model

- One **Entity** concept covers every kind of object; there are no per-type models.
- Entity fields: `id` (UUID, server-assigned), `name`, `type` (Entity Type), `status` (Status), `latitude`, `longitude`, `description` (optional), `attributes` (optional), `createdAt`, `updatedAt` (server-assigned, RFC 3339 UTC).
- **Entity Type** is one fixed set: `vehicle`, `iot_device`, `facility`, `other`.
- **Status** is one fixed set shared by all Entity Types: `active`, `inactive`, `maintenance`, `offline`.
- **Location** is one current point (latitude + longitude). No history, no shapes.
- **Attributes** are a flat map of string names to string values.
- Names are not unique.

### Validation rules (identical on backend and frontend)

| Field | Rule |
|---|---|
| name | required; trimmed; 1–100 characters after trimming |
| type | required; one of the Entity Type set |
| status | required; one of the Status set |
| latitude | required; number; −90 to 90 inclusive |
| longitude | required; number; −180 to 180 inclusive |
| description | optional; at most 500 characters |
| attributes | optional; at most 20 pairs; each name 1–50 characters; each value at most 200 characters; strings only |

- The **backend is the source of truth**. The frontend mirrors the same rules with a zod schema for immediate feedback, and always displays the backend's per-field errors.
- The backend reports **all** invalid fields at once, not just the first.
- Database constraints (CHECK on type, status, latitude and longitude ranges; NOT NULL on required fields) are a last line of defence behind the application validation.

### API contract

REST over JSON, all under `/api`. Field names are camelCase.

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/api/entities` | 200, array of Entities | optional `type` and `status` query parameters, each a single value; sorted by name, then id |
| GET | `/api/entities/{id}` | 200, Entity | 404 if unknown or not a valid UUID |
| POST | `/api/entities` | 201, created Entity | body: all writable fields |
| PUT | `/api/entities/{id}` | 200, updated Entity | full replace of writable fields; `createdAt` preserved, `updatedAt` refreshed |
| DELETE | `/api/entities/{id}` | 204, no body | hard delete; 404 if unknown |
| GET | `/healthz` | 200 | liveness for Docker health checks; outside `/api` |

- Writable fields: `name`, `type`, `status`, `latitude`, `longitude`, `description`, `attributes`. Any `id`, `createdAt` or `updatedAt` in a request body is ignored.
- Error body shape, for every non-2xx response:
  - `error`: machine-readable code — `validation_failed`, `bad_request`, `not_found`, `internal`
  - `message`: human-readable summary
  - `fields`: present only for `validation_failed`; maps each invalid field name to a reason
- Status codes: 400 malformed JSON, a body that is not a single JSON object, or body too large; 404 unknown/malformed id; 422 validation failure (including a field with the wrong JSON type, e.g. a string latitude, and invalid list filters); 500 unexpected failure with a generic message (details only in server logs).
- Request bodies are capped at 1 MB.
- **Request ID:** every response carries an `X-Request-ID` header. If the request sent an `X-Request-ID` (a non-empty value of at most 128 characters), the server reuses it; otherwise it generates a new UUID. Error bodies also include it as `requestId`.
- The API has **no authentication**: any client can call it. A client-identifying header was considered and rejected, because it can be forged and would give false assurance.
- No pagination: the list returns every matching Entity. Fine at hundreds of Entities.

### Backend modules

- **Entity module** (the one feature package) owns the Entity model, the validation rules, the HTTP handlers for the five endpoints, and the store that reads and writes Entities. Its public interface to the rest of the program is a constructor that takes a database connection pool and returns an HTTP handler to mount. Tests use the app handler (`app.NewHandler(pool, logger)`), the same one the server runs: it mounts the Entity module's handler and adds the request ID and logging middleware, `/healthz` and the JSON 404 fallback (see `docs/log.md` row 32).
- **Database module** holds the SQL migrations and the type-safe query code generated by sqlc from plain SQL.
- **Program entry point** reads configuration from environment variables (database URL, port, whether to seed), connects to PostgreSQL, runs migrations, optionally seeds, mounts the Entity handler and the health endpoint, and starts the server with graceful shutdown.
- **Request middleware** wraps every route: it assigns the request ID (see API contract), puts it in the request context, and logs one structured line per request with request ID, method, path, status and duration. Errors logged while handling a request include the same request ID. Logging uses the Go standard library's structured logger (`log/slog`), JSON output.
- Routing uses the Go standard library router (method + path patterns). No third-party router.
- Database access uses pgx; queries are written in SQL and compiled to Go with sqlc; migrations use goose and run automatically at startup.
- Validation is hand-written Go returning a map of field name → reason.
- Attributes are stored as JSONB; Entity Type and Status as text with CHECK constraints.
- **Seeding:** when seeding is enabled and the Entities table is empty, the backend inserts about ten sample Entities around Bandung covering every Entity Type and Status. Docker Compose enables seeding; tests do not.

### Frontend modules

- **API module** — a small fetch client for `/api/entities` that turns non-2xx responses into typed errors (carrying the per-field errors for 422 and the response's request ID), plus TanStack Query hooks: list (with filters), get one, create, update, delete. Mutations update the query cache so the map, list and details stay consistent.
- **Entities feature module** — the map with markers, the legend, the side list with filters, the details panel, the create/edit form, the delete confirmation, and the zod schema mirroring the backend rules.
- **Shared components** — small UI pieces (buttons, panels, field error text) used by the feature.
- UI state that isn't server data — selected Entity, current filters, whether the form is open, a pending map click Location — lives in React component state. No global state library.
- Forms use react-hook-form with the zod schema; server 422 field errors are mapped onto the matching form fields.
- Map: react-leaflet with OpenStreetMap tiles (no API key). Marker colour = Status; marker icon = Entity Type. Clicking empty map opens the create form with the clicked Location; dragging a marker sends a full PUT with the new Location; on failure the marker returns to its saved Location and an error is shown.
- Delete confirmation is an in-app dialog, not the browser's `confirm()`.
- General (non-field) error messages show the request ID from the failed response, e.g. "Something went wrong (request id: …)". The frontend does not generate request IDs itself.
- Filtering happens on the server via the list query parameters; the map and list render the same query result.
- Styling: Tailwind.
- Built with Vite.

### Running

- `docker compose up` starts three services: PostgreSQL, the backend, and the frontend.
- The frontend container serves the built app with a static web server that also forwards `/api` to the backend, so the browser talks to one origin and no CORS configuration is needed.
- In local development, the Vite dev server proxies `/api` to the backend for the same reason.
- The backend waits for PostgreSQL to be healthy before starting; the frontend waits for the backend's health endpoint.

### Versions

Latest stable, pinned exactly: Go 1.27, Node 26 LTS, React 19, TypeScript 7, Vite 8, Tailwind 4, PostgreSQL latest stable major. If TypeScript 7 is unsupported by a needed tool, fall back to the newest 6.x and record why in the decision log.

### Agent instructions

- `backend/` and `frontend/` each get an `AGENTS.md` (with a `CLAUDE.md` that only imports it) once their code exists, describing that area's layout, commands and conventions.

## Testing Decisions

### What makes a good test

- Tests exercise **external behaviour through the HTTP API contract** — the one seam for this feature — never internal functions, private helpers or SQL directly.
- A test should only fail when behaviour a client can observe changes; refactoring the internals must not break tests.
- No mock interfaces or mocking libraries in the backend. The only fake in the whole project is the fake API server used by frontend tests, sitting exactly at the seam.
- Tests use Glossary vocabulary in their names (Entity, Entity Type, Status, Location, Attributes).

### Backend

- Tests send real HTTP requests to the Entity module's handler and assert on status codes and JSON bodies.
- They run against a real, throwaway PostgreSQL started by testcontainers-go, with migrations applied, so SQL, migrations, validation and handlers are all covered together. Each test starts from a clean table.
- Coverage: create/get/list/update/delete happy paths; list filtering by Entity Type and Status; every validation rule, including boundaries (latitude exactly 90 is valid, 90.0001 is not; name of 100 characters valid, 101 not; 20 Attributes valid, 21 not); multiple invalid fields reported together; name trimming; ignored `id`/timestamps in the body; `createdAt` preserved and `updatedAt` refreshed on update; 400 for malformed JSON; 404 for unknown and malformed ids; 422 for invalid filters; every response carries an `X-Request-ID`, an incoming one is echoed back, an over-long one is replaced, and error bodies include the same `requestId`.
- Requires Docker to run.

### Frontend

- Vitest + Testing Library render the real app; MSW plays the backend at `/api/entities`, answering the way the Go API does (including 422 bodies).
- Coverage: the list shows Entities from the API; filters change what is shown; selecting an Entity shows its details; the create form blocks invalid input with field messages (empty name, out-of-range latitude, too many Attributes); a server 422 shows field errors next to the right fields; a successful create/update/delete is reflected in the list; load failure shows the retry message; a general server error shows the request ID from the response.
- Map gestures (click-to-create, dragging markers, marker colours and icons) are **not** automated, because Leaflet does not render in the test environment. They are covered by a manual test checklist in the README.

### Prior art

- None: the repository has no code yet. These tests set the patterns later work follows.

## Out of Scope

- Authentication, authorisation and multiple users. The API can be called by any client; the README states this.
- Client-identifying headers (e.g. `X-Client`), since without authentication they prove nothing.
- Distributed tracing (OpenTelemetry); the request ID covers tracing within this one backend.
- Real-time updates (WebSocket / server-sent events); other users' changes appear on reload.
- Location history, tracks and playback.
- Shapes other than a single point (polygons, lines, areas).
- Spatial queries and PostGIS (nearest Entity, within radius, viewport loading).
- Pagination of the Entity list.
- Soft delete, undo, audit log.
- Bulk import/export.
- Per-Entity-Type field schemas (Attributes are free-form).
- End-to-end browser tests.
- Internationalisation; the UI is in English.
- Mobile-specific layouts beyond basic responsiveness.

## Further Notes

- Time budget is about 12 hours of work; internal target 2026-11-03 10:00, hard deadline 2026-11-04 10:00. Anything unfinished at submission must be listed in the README.
- Code must stay simple and conventional so it can be explained in an interview; the developer reviews every ticket's output.
- One commit per ticket, so the history reads as the build order.
- The README must cover: how to run (Docker and local dev), test commands, library rationale (compiled from `docs/log.md`), the Agentic AI workflow (grilling → spec → tickets → implementation → review, and where the developer overrode the AI), the manual test checklist, and unfinished or out-of-scope items.
- At the end, a submission email is drafted for the developer to send; nothing is sent automatically.
- Full decision history with reasons and rejected alternatives: `docs/log.md`.
