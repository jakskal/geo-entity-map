# 05: Backend — create, update and delete Entities with validation

**Area:** backend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** An API client can create, fully update and delete Entities. Every write is validated against the spec's rules, all invalid fields are reported at once, and the server is the final authority on what gets stored.

**Blocked by:** 04 (Backend — read Entities and seed data)

**Status:** done

- [x] Hand-written validation implementing every rule in the spec's validation table, returning a map of field → reason
- [x] `POST /api/entities` → 201 with the created Entity (server-assigned id and timestamps)
- [x] `PUT /api/entities/{id}` → 200 with the updated Entity; full replace of writable fields; `createdAt` preserved, `updatedAt` refreshed; 404 for unknown/malformed id
- [x] `DELETE /api/entities/{id}` → 204 with no body; hard delete; 404 for unknown/malformed id
- [x] 422 `validation_failed` with every invalid field in `fields`; 400 `bad_request` for malformed JSON, wrong JSON types, or bodies over 1 MB
- [x] Name stored trimmed; any `id`, `createdAt`, `updatedAt` in the body ignored
- [x] Unexpected errors return 500 `internal` with a generic message; the detail is logged with the request ID
- [x] Tests through HTTP for: create/update/delete happy paths (verified with a follow-up GET); every rule including boundaries (latitude 90 valid / 90.0001 invalid, longitude 180 / 180.0001, name 100 / 101 characters, whitespace-only name, description 500 / 501, 20 / 21 Attributes, Attribute name 50 / 51 and empty, value 200 / 201); several invalid fields reported together; trimming; ignored server fields; timestamp behaviour on update; malformed JSON; oversized body
