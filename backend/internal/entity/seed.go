package entity

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// sampleEntities are spread around Bandung and cover every Entity Type and
// every Status.
var sampleEntities = []Input{
	{
		Name: "Delivery Van 01", Type: "vehicle", Status: "active",
		Latitude: -6.9175, Longitude: 107.6191,
		Description: "Daily parcel route around Alun-Alun Bandung.",
		Attributes:  map[string]string{"plate": "D 1234 ABC", "driver": "Budi"},
	},
	{
		Name: "Delivery Van 02", Type: "vehicle", Status: "maintenance",
		Latitude: -6.9389, Longitude: 107.6038,
		Description: "Brake service at the Kopo workshop.",
		Attributes:  map[string]string{"plate": "D 5678 XYZ"},
	},
	{
		Name: "Shuttle Bus Dago", Type: "vehicle", Status: "offline",
		Latitude: -6.8846, Longitude: 107.6134,
	},
	{
		Name: "Air Quality Sensor Gedung Sate", Type: "iot_device", Status: "active",
		Latitude: -6.9025, Longitude: 107.6187,
		Description: "Measures PM2.5 and PM10 every five minutes.",
		Attributes:  map[string]string{"firmware": "2.4.1", "battery": "87%"},
	},
	{
		Name: "Flood Sensor Citarum", Type: "iot_device", Status: "offline",
		Latitude: -6.9862, Longitude: 107.6345,
		Attributes: map[string]string{"firmware": "1.9.0"},
	},
	{
		Name: "Weather Station Lembang", Type: "iot_device", Status: "inactive",
		Latitude: -6.8121, Longitude: 107.6176,
		Description: "Paused for the dry season.",
	},
	{
		Name: "Warehouse Gedebage", Type: "facility", Status: "active",
		Latitude: -6.9411, Longitude: 107.6889,
		Description: "Main distribution warehouse.",
		Attributes:  map[string]string{"capacity": "1200 pallets", "manager": "Siti"},
	},
	{
		Name: "Depot Cimahi", Type: "facility", Status: "maintenance",
		Latitude: -6.8722, Longitude: 107.5425,
		Description: "Roof repairs in progress.",
	},
	{
		Name: "Charging Point Buah Batu", Type: "other", Status: "active",
		Latitude: -6.9468, Longitude: 107.6345,
		Attributes: map[string]string{"connectors": "2"},
	},
	{
		Name: "Signal Repeater Tangkuban", Type: "other", Status: "inactive",
		Latitude: -6.7597, Longitude: 107.6098,
		Description: "Spare repeater, not powered.",
	},
}

// Seed inserts the sample Entities if the Entities table is empty, and does
// nothing otherwise, so it is safe to run on every start.
func Seed(ctx context.Context, pool *pgxpool.Pool) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("seed: %w", err)
	}
	defer tx.Rollback(ctx) // no-op after Commit

	s := newStore(tx)
	n, err := s.count(ctx)
	if err != nil {
		return fmt.Errorf("seed: %w", err)
	}
	if n > 0 {
		return nil
	}
	for _, in := range sampleEntities {
		if _, err := s.create(ctx, in); err != nil {
			return fmt.Errorf("seed: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("seed: %w", err)
	}
	return nil
}
