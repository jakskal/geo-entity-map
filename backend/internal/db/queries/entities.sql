-- name: CountEntities :one
SELECT count(*) FROM entities;

-- name: ListEntities :many
-- A NULL filter matches every Entity.
SELECT * FROM entities
WHERE (sqlc.narg('type')::text IS NULL OR type = sqlc.narg('type')::text)
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status')::text)
ORDER BY name, id;

-- name: GetEntity :one
SELECT * FROM entities WHERE id = $1;

-- name: CreateEntity :one
INSERT INTO entities (name, type, status, latitude, longitude, description, attributes)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateEntity :one
-- Full replace of the writable fields; created_at is kept, updated_at refreshed.
UPDATE entities
SET name = $2, type = $3, status = $4, latitude = $5, longitude = $6,
    description = $7, attributes = $8, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteEntity :execrows
DELETE FROM entities WHERE id = $1;
