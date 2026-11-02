package app_test

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/jakskal/geo-entity-map/backend/internal/app"
	"github.com/jakskal/geo-entity-map/backend/internal/testdb"
)

// newServer starts the real application handler against a clean Entities table.
func newServer(t *testing.T) *httptest.Server {
	t.Helper()
	pool := testdb.New(t)
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	srv := httptest.NewServer(app.NewHandler(pool, logger))
	t.Cleanup(srv.Close)
	return srv
}

func get(t *testing.T, url string, header http.Header) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	for k, v := range header {
		req.Header[k] = v
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { resp.Body.Close() })
	return resp
}

func TestHealthCheckReturns200(t *testing.T) {
	srv := newServer(t)

	resp := get(t, srv.URL+"/healthz", nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestRequestIDIsGeneratedWhenAbsent(t *testing.T) {
	srv := newServer(t)

	resp := get(t, srv.URL+"/healthz", nil)

	id := resp.Header.Get("X-Request-ID")
	if _, err := uuid.Parse(id); err != nil {
		t.Fatalf("X-Request-ID = %q, want a generated UUID", id)
	}
}

func TestRequestIDIsEchoedWhenSent(t *testing.T) {
	srv := newServer(t)
	sent := strings.Repeat("a", 128)

	resp := get(t, srv.URL+"/healthz", http.Header{"X-Request-Id": {sent}})

	if got := resp.Header.Get("X-Request-ID"); got != sent {
		t.Fatalf("X-Request-ID = %q, want %q", got, sent)
	}
}

func TestRequestIDIsReplacedWhenOver128Characters(t *testing.T) {
	srv := newServer(t)
	sent := strings.Repeat("a", 129)

	resp := get(t, srv.URL+"/healthz", http.Header{"X-Request-Id": {sent}})

	id := resp.Header.Get("X-Request-ID")
	if _, err := uuid.Parse(id); err != nil {
		t.Fatalf("X-Request-ID = %q, want a newly generated UUID", id)
	}
}

func TestUnknownRouteReturns404ErrorBody(t *testing.T) {
	for _, path := range []string{"/nope", "/api/nope"} {
		t.Run(path, func(t *testing.T) {
			srv := newServer(t)

			resp := get(t, srv.URL+path, http.Header{"X-Request-Id": {"trace-123"}})

			if resp.StatusCode != http.StatusNotFound {
				t.Fatalf("status = %d, want 404", resp.StatusCode)
			}
			if ct := resp.Header.Get("Content-Type"); ct != "application/json" {
				t.Fatalf("Content-Type = %q, want application/json", ct)
			}
			var body map[string]any
			if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
				t.Fatal(err)
			}
			if body["error"] != "not_found" {
				t.Errorf("error = %v, want not_found", body["error"])
			}
			if msg, _ := body["message"].(string); msg == "" {
				t.Errorf("message is empty")
			}
			if body["requestId"] != "trace-123" {
				t.Errorf("requestId = %v, want trace-123", body["requestId"])
			}
			if _, ok := body["fields"]; ok {
				t.Errorf("fields present on a not_found error")
			}
		})
	}
}
