// Command api runs the Geo Entity Map HTTP server.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jakskal/geo-entity-map/backend/internal/app"
	"github.com/jakskal/geo-entity-map/backend/internal/db"
	"github.com/jakskal/geo-entity-map/backend/internal/entity"
)

// config is read from environment variables.
type config struct {
	DatabaseURL string // DATABASE_URL, required
	Port        string // PORT, default 8080
	Seed        bool   // SEED, default false; loads sample Entities into an empty table
}

func loadConfig() (config, error) {
	cfg := config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        os.Getenv("PORT"),
	}
	if cfg.DatabaseURL == "" {
		return cfg, errors.New("DATABASE_URL is required, e.g. postgres://user:pass@localhost:5432/entities")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if s := os.Getenv("SEED"); s != "" {
		seed, err := strconv.ParseBool(s)
		if err != nil {
			return cfg, fmt.Errorf("SEED must be true or false, got %q", s)
		}
		cfg.Seed = seed
	}
	return cfg, nil
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	if err := run(logger); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	// Cancelled on Ctrl+C or `docker stop`, which starts a graceful shutdown.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect to database: %w", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("connect to database: %w", err)
	}

	if err := db.Migrate(ctx, pool); err != nil {
		return err
	}

	if cfg.Seed {
		if err := entity.Seed(ctx, pool); err != nil {
			return err
		}
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           app.NewHandler(pool, logger),
		ReadHeaderTimeout: 5 * time.Second,
	}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("server listening", "addr", srv.Addr)
		serveErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
