package entity

import (
	"fmt"
	"slices"
	"strings"
	"unicode/utf8"
)

// Limits from the spec's validation table. Lengths count characters, not bytes.
const (
	maxNameLength           = 100
	maxDescriptionLength    = 500
	maxAttributes           = 20
	maxAttributeNameLength  = 50
	maxAttributeValueLength = 200
)

// validate checks a write request against every rule and returns a map of
// field name → reason for each invalid field. An empty map means valid.
func (req writeRequest) validate() map[string]string {
	fields := map[string]string{}

	name := strings.TrimSpace(req.Name)
	switch {
	case name == "":
		fields["name"] = "is required"
	case utf8.RuneCountInString(name) > maxNameLength:
		fields["name"] = fmt.Sprintf("must be at most %d characters", maxNameLength)
	}

	if req.Type == "" {
		fields["type"] = "is required"
	} else if reason := oneOf(req.Type, EntityTypes); reason != "" {
		fields["type"] = reason
	}

	if req.Status == "" {
		fields["status"] = "is required"
	} else if reason := oneOf(req.Status, Statuses); reason != "" {
		fields["status"] = reason
	}

	if reason := inRange(req.Latitude, 90); reason != "" {
		fields["latitude"] = reason
	}
	if reason := inRange(req.Longitude, 180); reason != "" {
		fields["longitude"] = reason
	}

	if utf8.RuneCountInString(req.Description) > maxDescriptionLength {
		fields["description"] = fmt.Sprintf("must be at most %d characters", maxDescriptionLength)
	}

	if reason := validateAttributes(req.Attributes); reason != "" {
		fields["attributes"] = reason
	}

	return fields
}

// inRange checks that a required coordinate is present and within ±limit.
func inRange(v *float64, limit float64) string {
	if v == nil {
		return "is required"
	}
	if *v < -limit || *v > limit {
		return fmt.Sprintf("must be between %g and %g", -limit, limit)
	}
	return ""
}

// validateAttributes returns the first problem found, checking names in
// sorted order so the reason is the same on every request.
func validateAttributes(attrs map[string]string) string {
	if len(attrs) > maxAttributes {
		return fmt.Sprintf("must have at most %d entries", maxAttributes)
	}
	names := make([]string, 0, len(attrs))
	for name := range attrs {
		names = append(names, name)
	}
	slices.Sort(names)
	for _, name := range names {
		switch {
		case name == "":
			return "names must not be empty"
		case utf8.RuneCountInString(name) > maxAttributeNameLength:
			return fmt.Sprintf("name %q must be at most %d characters", name, maxAttributeNameLength)
		case utf8.RuneCountInString(attrs[name]) > maxAttributeValueLength:
			return fmt.Sprintf("value of %q must be at most %d characters", name, maxAttributeValueLength)
		}
	}
	return ""
}
