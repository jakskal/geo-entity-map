# 04: Backend — read Entities and seed data

**Area:** backend

Spec: `docs/features/entity-management/spec.md` — read it first; this ticket only lists what is specific to it.

**What to build:** An API client can list all Entities (optionally filtered by Entity Type and/or Status) and fetch one Entity by id. When seeding is enabled and the table is empty, about ten sample Entities around Bandung are loaded, so there is data to read.

**Blocked by:** 01 (Backend skeleton)

**Status:** ready-for-agent

- [ ] `GET /api/entities` returns every Entity in the spec's JSON shape (camelCase, RFC 3339 UTC timestamps), sorted by name then id; empty list is `[]`, not `null`
- [ ] `type` and `status` query parameters filter the list, alone or together
- [ ] An invalid `type` or `status` filter value returns 422 with `fields` naming the parameter
- [ ] `GET /api/entities/{id}` returns the Entity; unknown id and malformed (non-UUID) id both return 404 in the error shape
- [ ] Seeding: with seeding on and an empty table, inserts ~10 Entities around Bandung covering every Entity Type and every Status, some with Attributes and descriptions; does nothing if the table has rows or seeding is off
- [ ] Tests through HTTP for: list empty, list with data and order, each filter, combined filters, invalid filters, get existing, get unknown, get malformed id; seeding inserts once and is idempotent
