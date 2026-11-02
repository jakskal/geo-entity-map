package app_test

import (
	"context"
	"encoding/json"
	"net/http"
	"regexp"
	"testing"
	"time"

	"net/http/httptest"

	"github.com/jakskal/geo-entity-map/backend/internal/entity"
)

// entityJSON mirrors the API's Entity shape, so decoding checks field names.
type entityJSON struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Status      string            `json:"status"`
	Latitude    float64           `json:"latitude"`
	Longitude   float64           `json:"longitude"`
	Description string            `json:"description"`
	Attributes  map[string]string `json:"attributes"`
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt"`
}

// givenEntity creates an Entity through POST /api/entities as test setup and
// returns its id.
func givenEntity(t *testing.T, srv *httptest.Server, name, entityType, status string) string {
	t.Helper()
	body := map[string]any{
		"name": name, "type": entityType, "status": status,
		"latitude": -6.9, "longitude": 107.6,
	}
	resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, body), nil)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create %q: status = %d, want 201", name, resp.StatusCode)
	}
	return decode[entityJSON](t, resp).ID
}

func decode[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	var v T
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		t.Fatal(err)
	}
	return v
}

func names(entities []entityJSON) []string {
	out := make([]string, len(entities))
	for i, e := range entities {
		out[i] = e.Name
	}
	return out
}

func TestListEntitiesReturnsEmptyArrayWhenNoEntities(t *testing.T) {
	srv := newServer(t)

	resp := get(t, srv.URL+"/api/entities", nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}
	raw := decode[json.RawMessage](t, resp)
	if string(raw) != "[]" {
		t.Fatalf("body = %s, want []", raw)
	}
}

func TestListEntitiesSortsByNameThenID(t *testing.T) {
	srv := newServer(t)
	givenEntity(t, srv, "Charlie", "vehicle", "active")
	idA := givenEntity(t, srv, "Alpha", "facility", "offline")
	idB := givenEntity(t, srv, "Alpha", "iot_device", "active")
	givenEntity(t, srv, "Bravo", "other", "maintenance")

	resp := get(t, srv.URL+"/api/entities", nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	got := decode[[]entityJSON](t, resp)
	want := []string{"Alpha", "Alpha", "Bravo", "Charlie"}
	if len(got) != len(want) {
		t.Fatalf("names = %v, want %v", names(got), want)
	}
	for i := range want {
		if got[i].Name != want[i] {
			t.Fatalf("names = %v, want %v", names(got), want)
		}
	}
	firstID, secondID := idA, idB
	if idB < idA {
		firstID, secondID = idB, idA
	}
	if got[0].ID != firstID || got[1].ID != secondID {
		t.Errorf("same-name Entities not ordered by id: got %s, %s", got[0].ID, got[1].ID)
	}
}

func TestEntityJSONShapeUsesCamelCaseAndUTCTimestamps(t *testing.T) {
	srv := newServer(t)
	id := givenEntity(t, srv, "Truck 7", "vehicle", "active")

	resp := get(t, srv.URL+"/api/entities/"+id, nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	body := decode[map[string]any](t, resp)
	wantKeys := []string{"id", "name", "type", "status", "latitude", "longitude",
		"description", "attributes", "createdAt", "updatedAt"}
	if len(body) != len(wantKeys) {
		t.Errorf("body has %d keys, want %d: %v", len(body), len(wantKeys), body)
	}
	for _, k := range wantKeys {
		if _, ok := body[k]; !ok {
			t.Errorf("missing key %q", k)
		}
	}
	if attrs, ok := body["attributes"].(map[string]any); !ok || len(attrs) != 0 {
		t.Errorf("attributes = %v, want {}", body["attributes"])
	}
	utc := regexp.MustCompile(`Z$`)
	for _, k := range []string{"createdAt", "updatedAt"} {
		s, _ := body[k].(string)
		if _, err := time.Parse(time.RFC3339, s); err != nil || !utc.MatchString(s) {
			t.Errorf("%s = %q, want an RFC 3339 UTC timestamp", k, s)
		}
	}
}

func TestListEntitiesFiltersByEntityTypeAndStatus(t *testing.T) {
	cases := []struct {
		name  string
		query string
		want  []string
	}{
		{"Entity Type", "?type=vehicle", []string{"Active vehicle", "Offline vehicle"}},
		{"Status", "?status=active", []string{"Active facility", "Active vehicle"}},
		{"Entity Type and Status", "?type=vehicle&status=offline", []string{"Offline vehicle"}},
		{"no match", "?type=other&status=maintenance", []string{}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := newServer(t)
			givenEntity(t, srv, "Active vehicle", "vehicle", "active")
			givenEntity(t, srv, "Offline vehicle", "vehicle", "offline")
			givenEntity(t, srv, "Active facility", "facility", "active")
			givenEntity(t, srv, "Inactive IoT device", "iot_device", "inactive")

			resp := get(t, srv.URL+"/api/entities"+tc.query, nil)

			if resp.StatusCode != http.StatusOK {
				t.Fatalf("status = %d, want 200", resp.StatusCode)
			}
			got := names(decode[[]entityJSON](t, resp))
			if len(got) != len(tc.want) {
				t.Fatalf("names = %v, want %v", got, tc.want)
			}
			for i := range tc.want {
				if got[i] != tc.want[i] {
					t.Fatalf("names = %v, want %v", got, tc.want)
				}
			}
		})
	}
}

func TestListEntitiesRejectsInvalidFilters(t *testing.T) {
	cases := []struct {
		query      string
		wantFields []string
	}{
		{"?type=spaceship", []string{"type"}},
		{"?status=broken", []string{"status"}},
		{"?type=spaceship&status=broken", []string{"type", "status"}},
		{"?type=VEHICLE", []string{"type"}},
	}
	for _, tc := range cases {
		t.Run(tc.query, func(t *testing.T) {
			srv := newServer(t)

			resp := get(t, srv.URL+"/api/entities"+tc.query, http.Header{"X-Request-Id": {"trace-422"}})

			if resp.StatusCode != http.StatusUnprocessableEntity {
				t.Fatalf("status = %d, want 422", resp.StatusCode)
			}
			body := decode[struct {
				Error     string            `json:"error"`
				Message   string            `json:"message"`
				Fields    map[string]string `json:"fields"`
				RequestID string            `json:"requestId"`
			}](t, resp)
			if body.Error != "validation_failed" {
				t.Errorf("error = %q, want validation_failed", body.Error)
			}
			if body.RequestID != "trace-422" {
				t.Errorf("requestId = %q, want trace-422", body.RequestID)
			}
			if len(body.Fields) != len(tc.wantFields) {
				t.Errorf("fields = %v, want keys %v", body.Fields, tc.wantFields)
			}
			for _, f := range tc.wantFields {
				if body.Fields[f] == "" {
					t.Errorf("fields[%q] missing in %v", f, body.Fields)
				}
			}
		})
	}
}

func TestGetEntityReturnsTheEntity(t *testing.T) {
	srv := newServer(t)
	id := givenEntity(t, srv, "Warehouse", "facility", "maintenance")
	givenEntity(t, srv, "Other one", "other", "active")

	resp := get(t, srv.URL+"/api/entities/"+id, nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	got := decode[entityJSON](t, resp)
	if got.ID != id || got.Name != "Warehouse" || got.Type != "facility" || got.Status != "maintenance" {
		t.Errorf("got %+v, want the Warehouse facility in maintenance", got)
	}
	if got.Latitude != -6.9 || got.Longitude != 107.6 {
		t.Errorf("Location = (%v, %v), want (-6.9, 107.6)", got.Latitude, got.Longitude)
	}
}

func TestGetEntityReturns404ForUnknownOrMalformedID(t *testing.T) {
	for name, id := range map[string]string{
		"unknown id":   "00000000-0000-4000-8000-000000000000",
		"malformed id": "not-a-uuid",
	} {
		t.Run(name, func(t *testing.T) {
			srv := newServer(t)

			resp := get(t, srv.URL+"/api/entities/"+id, http.Header{"X-Request-Id": {"trace-404"}})

			if resp.StatusCode != http.StatusNotFound {
				t.Fatalf("status = %d, want 404", resp.StatusCode)
			}
			body := decode[map[string]any](t, resp)
			if body["error"] != "not_found" || body["requestId"] != "trace-404" {
				t.Errorf("body = %v, want not_found with requestId trace-404", body)
			}
		})
	}
}

func TestSeedLoadsSampleEntitiesAroundBandungOnce(t *testing.T) {
	srv, pool := newServerWithPool(t)
	ctx := context.Background()

	if err := entity.Seed(ctx, pool); err != nil {
		t.Fatal(err)
	}
	first := decode[[]entityJSON](t, get(t, srv.URL+"/api/entities", nil))

	if len(first) < 8 || len(first) > 12 {
		t.Fatalf("seeded %d Entities, want about ten", len(first))
	}
	types, statuses := map[string]bool{}, map[string]bool{}
	withAttributes, withDescription := 0, 0
	for _, e := range first {
		types[e.Type] = true
		statuses[e.Status] = true
		if len(e.Attributes) > 0 {
			withAttributes++
		}
		if e.Description != "" {
			withDescription++
		}
		// Bandung is around -6.91, 107.61; allow the wider metropolitan area.
		if e.Latitude < -7.2 || e.Latitude > -6.6 || e.Longitude < 107.3 || e.Longitude > 107.9 {
			t.Errorf("%s Location (%v, %v) is not around Bandung", e.Name, e.Latitude, e.Longitude)
		}
	}
	for _, ty := range []string{"vehicle", "iot_device", "facility", "other"} {
		if !types[ty] {
			t.Errorf("no seeded Entity has Entity Type %q", ty)
		}
	}
	for _, st := range []string{"active", "inactive", "maintenance", "offline"} {
		if !statuses[st] {
			t.Errorf("no seeded Entity has Status %q", st)
		}
	}
	if withAttributes == 0 || withDescription == 0 {
		t.Errorf("seeded %d with Attributes and %d with descriptions, want some of each", withAttributes, withDescription)
	}

	if err := entity.Seed(ctx, pool); err != nil {
		t.Fatal(err)
	}
	second := decode[[]entityJSON](t, get(t, srv.URL+"/api/entities", nil))
	if len(second) != len(first) {
		t.Errorf("second Seed changed the count from %d to %d, want no change", len(first), len(second))
	}
}

func TestSeedDoesNothingWhenEntitiesExist(t *testing.T) {
	srv, pool := newServerWithPool(t)
	givenEntity(t, srv, "Existing", "other", "active")

	if err := entity.Seed(context.Background(), pool); err != nil {
		t.Fatal(err)
	}

	got := names(decode[[]entityJSON](t, get(t, srv.URL+"/api/entities", nil)))
	if len(got) != 1 || got[0] != "Existing" {
		t.Errorf("names = %v, want only [Existing]", got)
	}
}
