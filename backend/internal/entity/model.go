package entity

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/jakskal/geo-entity-map/backend/internal/db"
)

// EntityTypes is the fixed set of Entity Types.
var EntityTypes = []string{"vehicle", "iot_device", "facility", "other"}

// Statuses is the fixed set of Statuses, shared by every Entity Type.
var Statuses = []string{"active", "inactive", "maintenance", "offline"}

// Entity is the API representation of an Entity.
type Entity struct {
	ID          uuid.UUID         `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Status      string            `json:"status"`
	Latitude    float64           `json:"latitude"`
	Longitude   float64           `json:"longitude"`
	Description string            `json:"description"`
	Attributes  map[string]string `json:"attributes"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// Input holds the writable fields of an Entity.
type Input struct {
	Name        string
	Type        string
	Status      string
	Latitude    float64
	Longitude   float64
	Description string
	Attributes  map[string]string
}

// fromRow converts a database row to the API representation.
func fromRow(row db.Entity) (Entity, error) {
	attrs := map[string]string{}
	if len(row.Attributes) > 0 {
		if err := json.Unmarshal(row.Attributes, &attrs); err != nil {
			return Entity{}, fmt.Errorf("decode attributes of entity %s: %w", row.ID, err)
		}
	}
	return Entity{
		ID:          row.ID,
		Name:        row.Name,
		Type:        row.Type,
		Status:      row.Status,
		Latitude:    row.Latitude,
		Longitude:   row.Longitude,
		Description: row.Description,
		Attributes:  attrs,
		CreatedAt:   row.CreatedAt.UTC(),
		UpdatedAt:   row.UpdatedAt.UTC(),
	}, nil
}

// oneOf returns a validation reason naming the allowed values, or "" if
// value is allowed.
func oneOf(value string, allowed []string) string {
	if slices.Contains(allowed, value) {
		return ""
	}
	return "must be one of " + strings.Join(allowed, ", ")
}
