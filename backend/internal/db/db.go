package db

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"esg-together/backend/internal/config"
)

func Connect(ctx context.Context, cfg config.Config) (*pgxpool.Pool, error) {
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(cfg.SQLUser, cfg.SQLPassword),
		Host:   cfg.SQLHost + ":" + cfg.SQLPort,
		Path:   "/" + cfg.SQLDBName,
	}
	if cfg.SQLSSLMode != "" {
		q := url.Values{}
		q.Set("sslmode", cfg.SQLSSLMode)
		u.RawQuery = q.Encode()
	}
	pcfg, err := pgxpool.ParseConfig(u.String())
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	pcfg.MaxConns = 10
	pcfg.MinConns = 1
	pcfg.MaxConnIdleTime = 5 * time.Minute
	pcfg.MaxConnLifetime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, pcfg)
	if err != nil {
		return nil, err
	}
	pingCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}
