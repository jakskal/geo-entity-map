// Package entity owns the Entity model, its validation rules, its HTTP
// handlers and the store that reads and writes Entities.
package entity

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jakskal/geo-entity-map/backend/internal/httpx"
)

// NewHandler returns the HTTP handler for every /api route. Register routes
// with full paths, e.g. mux.HandleFunc("GET /api/entities", ...).
func NewHandler(pool *pgxpool.Pool) http.Handler {
	_ = pool // used by the Entity routes added in tickets 04 and 05

	mux := http.NewServeMux()
	mux.HandleFunc("/", httpx.NotFound)
	return mux
}
