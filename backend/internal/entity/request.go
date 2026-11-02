package entity

import (
	"encoding/json"
	"errors"
	"fmt"
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
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Status      string            `json:"status"`
	Latitude    *float64          `json:"latitude"`
	Longitude   *float64          `json:"longitude"`
	Description string            `json:"description"`
	Attributes  map[string]string `json:"attributes"`
}

// errBodyTooLarge is returned by decodeWriteRequest for bodies over 1 MB.
var errBodyTooLarge = errors.New("request body is larger than 1 MB")

// decodeWriteRequest reads a single JSON object from the body. Its errors
// are safe to show to the client.
func decodeWriteRequest(w http.ResponseWriter, r *http.Request) (writeRequest, error) {
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	var req writeRequest
	if err := dec.Decode(&req); err != nil {
		return writeRequest{}, describeDecodeError(err)
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		if err != nil {
			return writeRequest{}, describeDecodeError(err)
		}
		return writeRequest{}, errors.New("request body must contain a single JSON object")
	}
	return req, nil
}

func describeDecodeError(err error) error {
	var maxBytes *http.MaxBytesError
	var typeErr *json.UnmarshalTypeError
	switch {
	case errors.As(err, &maxBytes):
		return errBodyTooLarge
	case errors.As(err, &typeErr):
		if typeErr.Field == "" {
			return errors.New("request body must be a JSON object")
		}
		return fmt.Errorf("field %q has the wrong JSON type", typeErr.Field)
	case errors.Is(err, io.EOF):
		return errors.New("request body is empty")
	default:
		return errors.New("request body is not valid JSON")
	}
}

// toInput trims the name and drops the pointers. Call it only after
// validate reported no problems.
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
