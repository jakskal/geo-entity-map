package app_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jakskal/geo-entity-map/backend/internal/app"
	"github.com/jakskal/geo-entity-map/backend/internal/testdb"
)

// send makes a request with a raw JSON body (nil for none).
func send(t *testing.T, method, url string, body []byte, header http.Header) *http.Response {
	t.Helper()
	var r io.Reader
	if body != nil {
		r = bytes.NewReader(body)
	}
	req, err := http.NewRequest(method, url, r)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
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

func mustJSON(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

// validBody returns a valid write body; tests change one field at a time.
func validBody() map[string]any {
	return map[string]any{
		"name":        "Truck 7",
		"type":        "vehicle",
		"status":      "active",
		"latitude":    -6.9175,
		"longitude":   107.6191,
		"description": "Morning route",
		"attributes":  map[string]string{"plate": "D 1234 ABC"},
	}
}

func TestCreateEntityReturns201WithTheStoredEntity(t *testing.T) {
	srv := newServer(t)

	resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, validBody()), nil)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
	created := decode[entityJSON](t, resp)
	if created.ID == "" || created.CreatedAt == "" || created.UpdatedAt == "" {
		t.Fatalf("created = %+v, want server-assigned id and timestamps", created)
	}
	got := decode[entityJSON](t, get(t, srv.URL+"/api/entities/"+created.ID, nil))
	if got.Name != "Truck 7" || got.Type != "vehicle" || got.Status != "active" ||
		got.Latitude != -6.9175 || got.Longitude != 107.6191 ||
		got.Description != "Morning route" || got.Attributes["plate"] != "D 1234 ABC" || len(got.Attributes) != 1 {
		t.Errorf("stored Entity = %+v, want the values sent", got)
	}
}

func TestCreateEntityStoresNameTrimmed(t *testing.T) {
	srv := newServer(t)
	body := validBody()
	body["name"] = "  \tTruck 7 \n"

	created := decode[entityJSON](t, send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, body), nil))

	got := decode[entityJSON](t, get(t, srv.URL+"/api/entities/"+created.ID, nil))
	if got.Name != "Truck 7" {
		t.Errorf("name = %q, want %q", got.Name, "Truck 7")
	}
}

func TestCreateEntityIgnoresIDAndTimestampsInBody(t *testing.T) {
	srv := newServer(t)
	body := validBody()
	forgedID := "11111111-1111-4111-8111-111111111111"
	forgedTime := "2001-01-01T00:00:00Z"
	body["id"] = forgedID
	body["createdAt"] = forgedTime
	body["updatedAt"] = forgedTime

	resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, body), nil)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
	got := decode[entityJSON](t, resp)
	if got.ID == forgedID || got.CreatedAt == forgedTime || got.UpdatedAt == forgedTime {
		t.Errorf("created = %+v, want server-assigned id and timestamps", got)
	}
	if r := get(t, srv.URL+"/api/entities/"+forgedID, nil); r.StatusCode != http.StatusNotFound {
		t.Errorf("GET forged id status = %d, want 404", r.StatusCode)
	}
}

func TestWriteEntityRejectsUnreadableBodiesWith400(t *testing.T) {
	cases := map[string]string{
		"malformed JSON":            `{"name": "Truck 7",`,
		"not JSON":                  `hello`,
		"empty body":                ``,
		"array instead of object":   `[]`,
		"name is a number":          `{"name": 7, "type": "vehicle", "status": "active", "latitude": 1, "longitude": 1}`,
		"latitude is a string":      `{"name": "a", "type": "vehicle", "status": "active", "latitude": "1", "longitude": 1}`,
		"Attribute value is number": `{"name": "a", "type": "vehicle", "status": "active", "latitude": 1, "longitude": 1, "attributes": {"k": 1}}`,
		"two JSON objects":          `{} {}`,
		"body over 1 MB":            `{"name": "a", "description": "` + strings.Repeat("d", 1<<20) + `"}`,
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			srv := newServer(t)
			id := givenEntity(t, srv, "Existing", "other", "active")

			for _, req := range []struct{ method, path string }{
				{http.MethodPost, "/api/entities"},
				{http.MethodPut, "/api/entities/" + id},
			} {
				resp := send(t, req.method, srv.URL+req.path, []byte(body), http.Header{"X-Request-Id": {"trace-400"}})

				if resp.StatusCode != http.StatusBadRequest {
					t.Fatalf("%s status = %d, want 400", req.method, resp.StatusCode)
				}
				got := decode[errorJSON](t, resp)
				if got.Error != "bad_request" || got.RequestID != "trace-400" || got.Message == "" || got.Fields != nil {
					t.Errorf("%s body = %+v, want bad_request with requestId trace-400 and no fields", req.method, got)
				}
			}
		})
	}
}

func TestUpdateEntityReplacesWritableFields(t *testing.T) {
	srv := newServer(t)
	created := decode[entityJSON](t, send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, validBody()), nil))
	time.Sleep(10 * time.Millisecond) // so a refreshed updatedAt is visibly later
	body := map[string]any{
		"name":      "  Warehouse 2 ",
		"type":      "facility",
		"status":    "maintenance",
		"latitude":  0,
		"longitude": -180,
		// description and attributes omitted: a full replace clears them
		"id":        "11111111-1111-4111-8111-111111111111",
		"createdAt": "2001-01-01T00:00:00Z",
		"updatedAt": "2001-01-01T00:00:00Z",
	}

	resp := send(t, http.MethodPut, srv.URL+"/api/entities/"+created.ID, mustJSON(t, body), nil)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %+v", resp.StatusCode, decode[errorJSON](t, resp))
	}
	updated := decode[entityJSON](t, resp)
	got := decode[entityJSON](t, get(t, srv.URL+"/api/entities/"+created.ID, nil))
	if !reflect.DeepEqual(got, updated) {
		t.Errorf("GET = %+v, want the PUT response %+v", got, updated)
	}
	if got.ID != created.ID || got.Name != "Warehouse 2" || got.Type != "facility" || got.Status != "maintenance" ||
		got.Latitude != 0 || got.Longitude != -180 || got.Description != "" || len(got.Attributes) != 0 {
		t.Errorf("stored Entity = %+v, want exactly the values sent", got)
	}
	if got.CreatedAt != created.CreatedAt {
		t.Errorf("createdAt = %s, want it preserved as %s", got.CreatedAt, created.CreatedAt)
	}
	before, _ := time.Parse(time.RFC3339Nano, created.UpdatedAt)
	after, err := time.Parse(time.RFC3339Nano, got.UpdatedAt)
	if err != nil || !after.After(before) {
		t.Errorf("updatedAt = %s, want later than %s", got.UpdatedAt, created.UpdatedAt)
	}
}

func TestUpdateEntityValidatesTheBody(t *testing.T) {
	srv := newServer(t)
	id := givenEntity(t, srv, "Existing", "other", "active")
	body := validBody()
	body["name"] = strings.Repeat("a", 101)
	body["latitude"] = 90.0001

	resp := send(t, http.MethodPut, srv.URL+"/api/entities/"+id, mustJSON(t, body), nil)

	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
	got := decode[errorJSON](t, resp)
	if got.Error != "validation_failed" || len(got.Fields) != 2 || got.Fields["name"] == "" || got.Fields["latitude"] == "" {
		t.Errorf("body = %+v, want validation_failed for name and latitude", got)
	}
	if stored := decode[entityJSON](t, get(t, srv.URL+"/api/entities/"+id, nil)); stored.Name != "Existing" {
		t.Errorf("name = %q, want the Entity unchanged", stored.Name)
	}
}

func TestDeleteEntityRemovesIt(t *testing.T) {
	srv := newServer(t)
	id := givenEntity(t, srv, "Doomed", "vehicle", "offline")
	keep := givenEntity(t, srv, "Kept", "vehicle", "active")

	resp := send(t, http.MethodDelete, srv.URL+"/api/entities/"+id, nil, nil)

	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", resp.StatusCode)
	}
	if b, _ := io.ReadAll(resp.Body); len(b) != 0 {
		t.Errorf("body = %q, want none", b)
	}
	if r := get(t, srv.URL+"/api/entities/"+id, nil); r.StatusCode != http.StatusNotFound {
		t.Errorf("GET deleted Entity status = %d, want 404", r.StatusCode)
	}
	list := decode[[]entityJSON](t, get(t, srv.URL+"/api/entities", nil))
	if len(list) != 1 || list[0].ID != keep {
		t.Errorf("remaining = %v, want only Kept", names(list))
	}
}

func TestUpdateAndDeleteReturn404ForUnknownOrMalformedID(t *testing.T) {
	ids := map[string]string{
		"unknown id":   "00000000-0000-4000-8000-000000000000",
		"malformed id": "not-a-uuid",
	}
	for name, id := range ids {
		for _, method := range []string{http.MethodPut, http.MethodDelete} {
			t.Run(method+" "+name, func(t *testing.T) {
				srv := newServer(t)
				var body []byte
				if method == http.MethodPut {
					body = mustJSON(t, validBody())
				}

				resp := send(t, method, srv.URL+"/api/entities/"+id, body, http.Header{"X-Request-Id": {"trace-404"}})

				if resp.StatusCode != http.StatusNotFound {
					t.Fatalf("status = %d, want 404", resp.StatusCode)
				}
				got := decode[errorJSON](t, resp)
				if got.Error != "not_found" || got.RequestID != "trace-404" {
					t.Errorf("body = %+v, want not_found with requestId trace-404", got)
				}
			})
		}
	}
}

func TestWriteEntityReturns500WithGenericMessageWhenTheDatabaseFails(t *testing.T) {
	// A closed pool of its own makes every database call fail, without
	// touching the shared test database.
	broken, err := pgxpool.NewWithConfig(context.Background(), testdb.New(t).Config())
	if err != nil {
		t.Fatal(err)
	}
	broken.Close()
	var logs bytes.Buffer
	srv := httptest.NewServer(app.NewHandler(broken, slog.New(slog.NewJSONHandler(&logs, nil))))
	t.Cleanup(srv.Close)

	resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, validBody()), http.Header{"X-Request-Id": {"trace-500"}})

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
	got := decode[errorJSON](t, resp)
	if got.Error != "internal" || got.Message != "something went wrong" || got.RequestID != "trace-500" {
		t.Errorf("body = %+v, want internal with a generic message and requestId trace-500", got)
	}
	if !strings.Contains(logs.String(), `"msg":"internal error"`) || !strings.Contains(logs.String(), `"requestId":"trace-500"`) ||
		!strings.Contains(logs.String(), "closed pool") {
		t.Errorf("logs = %s, want the internal error detail logged with requestId trace-500", logs.String())
	}
}

// errorJSON mirrors the API's error body.
type errorJSON struct {
	Error     string            `json:"error"`
	Message   string            `json:"message"`
	Fields    map[string]string `json:"fields"`
	RequestID string            `json:"requestId"`
}

// attributes returns n distinct Attributes with short names and values.
func attributes(n int) map[string]string {
	m := map[string]string{}
	for i := range n {
		m[fmt.Sprintf("key%02d", i)] = "value"
	}
	return m
}

func TestCreateEntityValidatesEveryField(t *testing.T) {
	cases := []struct {
		name      string
		change    func(b map[string]any)
		wantField string // "" means the body is valid
	}{
		{"name missing", func(b map[string]any) { delete(b, "name") }, "name"},
		{"name empty", func(b map[string]any) { b["name"] = "" }, "name"},
		{"name only whitespace", func(b map[string]any) { b["name"] = "   \t " }, "name"},
		{"name 100 characters", func(b map[string]any) { b["name"] = strings.Repeat("a", 100) }, ""},
		{"name 101 characters", func(b map[string]any) { b["name"] = strings.Repeat("a", 101) }, "name"},
		{"name 100 characters after trimming", func(b map[string]any) { b["name"] = "  " + strings.Repeat("a", 100) + "  " }, ""},
		{"name 100 multi-byte characters", func(b map[string]any) { b["name"] = strings.Repeat("é", 100) }, ""},
		{"Entity Type missing", func(b map[string]any) { delete(b, "type") }, "type"},
		{"Entity Type unknown", func(b map[string]any) { b["type"] = "spaceship" }, "type"},
		{"Entity Type wrong case", func(b map[string]any) { b["type"] = "Vehicle" }, "type"},
		{"Status missing", func(b map[string]any) { delete(b, "status") }, "status"},
		{"Status unknown", func(b map[string]any) { b["status"] = "broken" }, "status"},
		{"latitude missing", func(b map[string]any) { delete(b, "latitude") }, "latitude"},
		{"latitude null", func(b map[string]any) { b["latitude"] = nil }, "latitude"},
		{"latitude 0", func(b map[string]any) { b["latitude"] = 0 }, ""},
		{"latitude 90", func(b map[string]any) { b["latitude"] = 90 }, ""},
		{"latitude -90", func(b map[string]any) { b["latitude"] = -90 }, ""},
		{"latitude 90.0001", func(b map[string]any) { b["latitude"] = 90.0001 }, "latitude"},
		{"latitude -90.0001", func(b map[string]any) { b["latitude"] = -90.0001 }, "latitude"},
		{"longitude missing", func(b map[string]any) { delete(b, "longitude") }, "longitude"},
		{"longitude 0", func(b map[string]any) { b["longitude"] = 0 }, ""},
		{"longitude 180", func(b map[string]any) { b["longitude"] = 180 }, ""},
		{"longitude -180", func(b map[string]any) { b["longitude"] = -180 }, ""},
		{"longitude 180.0001", func(b map[string]any) { b["longitude"] = 180.0001 }, "longitude"},
		{"longitude -180.0001", func(b map[string]any) { b["longitude"] = -180.0001 }, "longitude"},
		{"description missing", func(b map[string]any) { delete(b, "description") }, ""},
		{"description 500 characters", func(b map[string]any) { b["description"] = strings.Repeat("d", 500) }, ""},
		{"description 501 characters", func(b map[string]any) { b["description"] = strings.Repeat("d", 501) }, "description"},
		{"Attributes missing", func(b map[string]any) { delete(b, "attributes") }, ""},
		{"Attributes null", func(b map[string]any) { b["attributes"] = nil }, ""},
		{"20 Attributes", func(b map[string]any) { b["attributes"] = attributes(20) }, ""},
		{"21 Attributes", func(b map[string]any) { b["attributes"] = attributes(21) }, "attributes"},
		{"Attribute name 50 characters", func(b map[string]any) { b["attributes"] = map[string]string{strings.Repeat("k", 50): "v"} }, ""},
		{"Attribute name 51 characters", func(b map[string]any) { b["attributes"] = map[string]string{strings.Repeat("k", 51): "v"} }, "attributes"},
		{"Attribute name empty", func(b map[string]any) { b["attributes"] = map[string]string{"": "v"} }, "attributes"},
		{"Attribute value empty", func(b map[string]any) { b["attributes"] = map[string]string{"k": ""} }, ""},
		{"Attribute value 200 characters", func(b map[string]any) { b["attributes"] = map[string]string{"k": strings.Repeat("v", 200)} }, ""},
		{"Attribute value 201 characters", func(b map[string]any) { b["attributes"] = map[string]string{"k": strings.Repeat("v", 201)} }, "attributes"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := newServer(t)
			body := validBody()
			tc.change(body)

			resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, body), http.Header{"X-Request-Id": {"trace-422"}})

			if tc.wantField == "" {
				if resp.StatusCode != http.StatusCreated {
					t.Fatalf("status = %d, want 201; body %+v", resp.StatusCode, decode[errorJSON](t, resp))
				}
				return
			}
			if resp.StatusCode != http.StatusUnprocessableEntity {
				t.Fatalf("status = %d, want 422", resp.StatusCode)
			}
			got := decode[errorJSON](t, resp)
			if got.Error != "validation_failed" || got.RequestID != "trace-422" || got.Message == "" {
				t.Errorf("body = %+v, want validation_failed with requestId trace-422", got)
			}
			if len(got.Fields) != 1 || got.Fields[tc.wantField] == "" {
				t.Errorf("fields = %v, want only %q", got.Fields, tc.wantField)
			}
			list := decode[[]entityJSON](t, get(t, srv.URL+"/api/entities", nil))
			if len(list) != 0 {
				t.Errorf("an invalid Entity was stored: %v", names(list))
			}
		})
	}
}

func TestCreateEntityReportsEveryInvalidFieldAtOnce(t *testing.T) {
	srv := newServer(t)
	body := map[string]any{
		"name":        " ",
		"type":        "spaceship",
		"latitude":    91,
		"description": strings.Repeat("d", 501),
		"attributes":  attributes(21),
	}

	resp := send(t, http.MethodPost, srv.URL+"/api/entities", mustJSON(t, body), nil)

	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
	got := decode[errorJSON](t, resp)
	want := []string{"name", "type", "status", "latitude", "longitude", "description", "attributes"}
	if len(got.Fields) != len(want) {
		t.Errorf("fields = %v, want keys %v", got.Fields, want)
	}
	for _, f := range want {
		if got.Fields[f] == "" {
			t.Errorf("fields[%q] missing in %v", f, got.Fields)
		}
	}
}
