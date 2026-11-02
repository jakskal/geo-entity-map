package entity

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

// maxBodyBytes caps write request bodies at 1 MB.
const maxBodyBytes = 1 << 20

// writeRequest is the JSON body of POST and PUT. Latitude and longitude are
// pointers so a missing value can be told apart from 0. Unknown fields,
// including id, createdAt and updatedAt, are ignored.
type writeRequest struct {
	Name        string
	Type        string
	Status      string
	Latitude    *float64
	Longitude   *float64
	Description string
	Attributes  map[string]string
}

// errBodyTooLarge is returned by decodeWriteRequest for bodies over 1 MB.
var errBodyTooLarge = errors.New("request body is larger than 1 MB")

// decodeWriteRequest reads a single JSON object from the body.
//
// err means the body is unusable (400); its message is safe to show to the
// client. typeErrs maps each field whose JSON type is wrong, e.g. a string
// latitude, to a reason: those are validation failures (422), reported
// together with the other invalid fields.
func decodeWriteRequest(w http.ResponseWriter, r *http.Request) (req writeRequest, typeErrs map[string]string, err error) {
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	var raw map[string]json.RawMessage
	if err := dec.Decode(&raw); err != nil {
		return writeRequest{}, nil, describeDecodeError(err)
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		if err != nil {
			return writeRequest{}, nil, describeDecodeError(err)
		}
		return writeRequest{}, nil, errors.New("request body must contain a single JSON object")
	}

	typeErrs = map[string]string{}
	decodeField(raw, "name", &req.Name, "must be a string", typeErrs)
	decodeField(raw, "type", &req.Type, "must be a string", typeErrs)
	decodeField(raw, "status", &req.Status, "must be a string", typeErrs)
	decodeField(raw, "latitude", &req.Latitude, "must be a number", typeErrs)
	decodeField(raw, "longitude", &req.Longitude, "must be a number", typeErrs)
	decodeField(raw, "description", &req.Description, "must be a string", typeErrs)

	var attrs map[string]json.RawMessage
	decodeField(raw, "attributes", &attrs, "must be an object", typeErrs)
	for name, value := range attrs {
		var s string
		if err := json.Unmarshal(value, &s); err != nil {
			typeErrs["attributes"] = "values must be strings"
			break
		}
		if req.Attributes == nil {
			req.Attributes = make(map[string]string, len(attrs))
		}
		req.Attributes[name] = s
	}
	return req, typeErrs, nil
}

// decodeField decodes raw[name] into dst when the field is present. If the
// JSON type does not fit dst, it records reason for the field in typeErrs.
func decodeField(raw map[string]json.RawMessage, name string, dst any, reason string, typeErrs map[string]string) {
	value, ok := raw[name]
	if !ok {
		return
	}
	if err := json.Unmarshal(value, dst); err != nil {
		typeErrs[name] = reason
	}
}

func describeDecodeError(err error) error {
	var maxBytes *http.MaxBytesError
	var typeErr *json.UnmarshalTypeError
	switch {
	case errors.As(err, &maxBytes):
		return errBodyTooLarge
	case errors.As(err, &typeErr):
		return errors.New("request body must be a JSON object")
	case errors.Is(err, io.EOF):
		return errors.New("request body is empty")
	default:
		return errors.New("request body is not valid JSON")
	}
}

// toInput trims the name and drops the pointers. Call it only after
// validation reported no problems.
func (req writeRequest) toInput() Input {
	return Input{
		Name:        strings.TrimSpace(req.Name),
		Type:        req.Type,
		Status:      req.Status,
		Latitude:    *req.Latitude,
		Longitude:   *req.Longitude,
		Description: req.Description,
		Attributes:  req.Attributes,
	}
}
