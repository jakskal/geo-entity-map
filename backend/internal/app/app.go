// Package app assembles the complete HTTP handler: the health check, the
// Entity routes, unknown-route 404s, and the request middleware around them.
package app

import (
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jakskal/geo-entity-map/backend/internal/entity"
	"github.com/jakskal/geo-entity-map/backend/internal/httpx"
)

// NewHandler returns the handler the server runs and the tests call.
func NewHandler(pool *pgxpool.Pool, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.Handle("/api/", entity.NewHandler(pool))
	mux.HandleFunc("/", httpx.NotFound)
	return httpx.Middleware(logger, mux)
}
