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
