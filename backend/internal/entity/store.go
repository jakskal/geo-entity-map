package entity

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/jakskal/geo-entity-map/backend/internal/db"
)

// errNotFound is returned by the store when no Entity has the given id.
var errNotFound = errors.New("entity not found")

// filter narrows a list of Entities; an empty field matches everything.
type filter struct {
	Type   string
	Status string
}

// store reads and writes Entities, converting between rows and the API model.
type store struct {
	q *db.Queries
}

func newStore(conn db.DBTX) store {
	return store{q: db.New(conn)}
}

func (s store) list(ctx context.Context, f filter) ([]Entity, error) {
	rows, err := s.q.ListEntities(ctx, db.ListEntitiesParams{
		Type:   optionalText(f.Type),
		Status: optionalText(f.Status),
	})
	if err != nil {
		return nil, fmt.Errorf("list entities: %w", err)
	}
	entities := make([]Entity, 0, len(rows))
	for _, row := range rows {
		e, err := fromRow(row)
		if err != nil {
			return nil, err
		}
		entities = append(entities, e)
	}
	return entities, nil
}

func (s store) get(ctx context.Context, id uuid.UUID) (Entity, error) {
	row, err := s.q.GetEntity(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Entity{}, errNotFound
	}
	if err != nil {
		return Entity{}, fmt.Errorf("get entity %s: %w", id, err)
	}
	return fromRow(row)
}

// create stores a new Entity. It does not validate; callers do.
func (s store) create(ctx context.Context, in Input) (Entity, error) {
	attrsJSON, err := encodeAttributes(in.Attributes)
	if err != nil {
		return Entity{}, err
	}
	row, err := s.q.CreateEntity(ctx, db.CreateEntityParams{
		Name:        in.Name,
		Type:        in.Type,
		Status:      in.Status,
		Latitude:    in.Latitude,
		Longitude:   in.Longitude,
		Description: in.Description,
		Attributes:  attrsJSON,
	})
	if err != nil {
		return Entity{}, fmt.Errorf("create entity: %w", err)
	}
	return fromRow(row)
}

// update replaces the writable fields of an Entity, keeping createdAt and
// refreshing updatedAt. It does not validate; callers do.
func (s store) update(ctx context.Context, id uuid.UUID, in Input) (Entity, error) {
	attrsJSON, err := encodeAttributes(in.Attributes)
	if err != nil {
		return Entity{}, err
	}
	row, err := s.q.UpdateEntity(ctx, db.UpdateEntityParams{
		ID:          id,
		Name:        in.Name,
		Type:        in.Type,
		Status:      in.Status,
		Latitude:    in.Latitude,
		Longitude:   in.Longitude,
		Description: in.Description,
		Attributes:  attrsJSON,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Entity{}, errNotFound
	}
	if err != nil {
		return Entity{}, fmt.Errorf("update entity %s: %w", id, err)
	}
	return fromRow(row)
}

// delete removes an Entity for good.
func (s store) delete(ctx context.Context, id uuid.UUID) error {
	n, err := s.q.DeleteEntity(ctx, id)
	if err != nil {
		return fmt.Errorf("delete entity %s: %w", id, err)
	}
	if n == 0 {
		return errNotFound
	}
	return nil
}

func (s store) count(ctx context.Context) (int64, error) {
	n, err := s.q.CountEntities(ctx)
	if err != nil {
		return 0, fmt.Errorf("count entities: %w", err)
	}
	return n, nil
}

// optionalText maps "" to SQL NULL, which the list query treats as "no filter".
func optionalText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}

// encodeAttributes turns Attributes into JSONB, storing nil as {}.
func encodeAttributes(attrs map[string]string) ([]byte, error) {
	if attrs == nil {
		attrs = map[string]string{}
	}
	b, err := json.Marshal(attrs)
	if err != nil {
		return nil, fmt.Errorf("encode attributes: %w", err)
	}
	return b, nil
}
