// Package entity owns the Entity model, its validation rules, its HTTP
// handlers and the store that reads and writes Entities.
package entity

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jakskal/geo-entity-map/backend/internal/httpx"
)

// NewHandler returns the HTTP handler for every /api route. Register routes
// with full paths, e.g. mux.HandleFunc("GET /api/entities", ...).
func NewHandler(pool *pgxpool.Pool) http.Handler {
	h := handler{store: newStore(pool)}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/entities", h.list)
	mux.HandleFunc("GET /api/entities/{id}", h.get)
	mux.HandleFunc("POST /api/entities", h.create)
	mux.HandleFunc("PUT /api/entities/{id}", h.update)
	mux.HandleFunc("DELETE /api/entities/{id}", h.delete)
	mux.HandleFunc("/", httpx.NotFound)
	return mux
}

type handler struct {
	store store
}

// list answers GET /api/entities with optional type and status filters.
// An absent or empty parameter means no filter.
func (h handler) list(w http.ResponseWriter, r *http.Request) {
	f := filter{
		Type:   r.URL.Query().Get("type"),
		Status: r.URL.Query().Get("status"),
	}
	fields := map[string]string{}
	if f.Type != "" {
		if reason := oneOf(f.Type, EntityTypes); reason != "" {
			fields["type"] = reason
		}
	}
	if f.Status != "" {
		if reason := oneOf(f.Status, Statuses); reason != "" {
			fields["status"] = reason
		}
	}
	if len(fields) > 0 {
		httpx.WriteError(w, r, http.StatusUnprocessableEntity, httpx.CodeValidationFailed, "invalid filter", fields)
		return
	}

	entities, err := h.store.list(r.Context(), f)
	if err != nil {
		httpx.InternalError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, entities)
}

// get answers GET /api/entities/{id}. A malformed id is treated as unknown.
func (h handler) get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.NotFound(w, r)
		return
	}
	e, err := h.store.get(r.Context(), id)
	if errors.Is(err, errNotFound) {
		httpx.NotFound(w, r)
		return
	}
	if err != nil {
		httpx.InternalError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, e)
}

// create answers POST /api/entities with the stored Entity.
func (h handler) create(w http.ResponseWriter, r *http.Request) {
	in, ok := readInput(w, r)
	if !ok {
		return
	}
	e, err := h.store.create(r.Context(), in)
	if err != nil {
		httpx.InternalError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, e)
}

// update answers PUT /api/entities/{id}: a full replace of the writable
// fields. A malformed id is treated as unknown.
func (h handler) update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.NotFound(w, r)
		return
	}
	in, ok := readInput(w, r)
	if !ok {
		return
	}
	e, err := h.store.update(r.Context(), id, in)
	if errors.Is(err, errNotFound) {
		httpx.NotFound(w, r)
		return
	}
	if err != nil {
		httpx.InternalError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, e)
}

// delete answers DELETE /api/entities/{id} with 204 and no body. A
// malformed id is treated as unknown.
func (h handler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.NotFound(w, r)
		return
	}
	err = h.store.delete(r.Context(), id)
	if errors.Is(err, errNotFound) {
		httpx.NotFound(w, r)
		return
	}
	if err != nil {
		httpx.InternalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// readInput decodes and validates a write body. If it is unusable, it
// writes the 400 or 422 response and returns false.
func readInput(w http.ResponseWriter, r *http.Request) (Input, bool) {
	req, err := decodeWriteRequest(w, r)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, httpx.CodeBadRequest, err.Error(), nil)
		return Input{}, false
	}
	if fields := req.validate(); len(fields) > 0 {
		httpx.WriteError(w, r, http.StatusUnprocessableEntity, httpx.CodeValidationFailed, "invalid Entity", fields)
		return Input{}, false
	}
	return req.toInput(), true
}
