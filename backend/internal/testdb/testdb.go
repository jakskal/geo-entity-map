// Package testdb gives tests a throwaway PostgreSQL with migrations applied.
// It needs Docker.
package testdb

import (
	"context"
	"sync"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/jakskal/geo-entity-map/backend/internal/db"
)

// Image is the PostgreSQL image used by tests; keep it in step with Docker Compose.
const Image = "postgres:18.6-alpine3.24"

var (
	once     sync.Once
	pool     *pgxpool.Pool
	startErr error
)

// New returns a pool connected to the shared test database, with an empty
// Entities table. The container starts on first use in a test binary and is
// removed by testcontainers when the binary exits.
func New(t *testing.T) *pgxpool.Pool {
	t.Helper()
	once.Do(func() { pool, startErr = start(context.Background()) })
	if startErr != nil {
		t.Fatalf("start test database: %v", startErr)
	}
	if _, err := pool.Exec(context.Background(), "TRUNCATE entities"); err != nil {
		t.Fatalf("clean Entities table: %v", err)
	}
	return pool
}

func start(ctx context.Context) (*pgxpool.Pool, error) {
	container, err := postgres.Run(ctx, Image,
		postgres.WithDatabase("entities_test"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		return nil, err
	}
	url, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		return nil, err
	}
	p, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err := db.Migrate(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}
