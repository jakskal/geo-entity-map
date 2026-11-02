// Package httpx holds the HTTP plumbing shared by every route: request IDs,
// request logging and the JSON error body.
package httpx

import (
	"encoding/json"
	"net/http"
)

// Machine-readable error codes used in the "error" field of error bodies.
const (
	CodeValidationFailed = "validation_failed"
	CodeBadRequest       = "bad_request"
	CodeNotFound         = "not_found"
	CodeInternal         = "internal"
)

// ErrorBody is the JSON body of every non-2xx response.
type ErrorBody struct {
	Error     string            `json:"error"`
	Message   string            `json:"message"`
	Fields    map[string]string `json:"fields,omitempty"`
	RequestID string            `json:"requestId"`
}

// WriteJSON writes v as a JSON response with the given status code.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// WriteError writes an error body. Pass fields only for validation_failed
// errors, nil otherwise.
func WriteError(w http.ResponseWriter, r *http.Request, status int, code, message string, fields map[string]string) {
	WriteJSON(w, status, ErrorBody{
		Error:     code,
		Message:   message,
		Fields:    fields,
		RequestID: RequestID(r.Context()),
	})
}

// NotFound answers any route or resource that does not exist.
func NotFound(w http.ResponseWriter, r *http.Request) {
	WriteError(w, r, http.StatusNotFound, CodeNotFound, "resource not found", nil)
}

// InternalError logs err with the request ID and answers 500 with a generic
// message; details stay in the server log.
func InternalError(w http.ResponseWriter, r *http.Request, err error) {
	Logger(r.Context()).Error("internal error", "error", err)
	WriteError(w, r, http.StatusInternalServerError, CodeInternal, "something went wrong", nil)
}
