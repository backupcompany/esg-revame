package api

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

type limiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

func newLimiter() *limiter {
	return &limiter{hits: map[string][]time.Time{}}
}

func (l *limiter) allow(key string, max int, window time.Duration) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()
	cut := now.Add(-window)
	arr := l.hits[key]
	kept := arr[:0]
	for _, t := range arr {
		if t.After(cut) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= max {
		l.hits[key] = kept
		return false
	}
	if _, ok := l.hits[key]; !ok && len(l.hits) >= 8192 {
		// ponytail: fail-closed cap, LRU if this trips in prod
		return false
	}
	if len(kept) == 0 {
		delete(l.hits, key)
	}
	l.hits[key] = append(kept, now)
	return true
}

func (s *Server) limitPublic(max int) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if ip == "" {
			ip = "unknown"
		}
		// include max in key so stacked limitPublic(N) middlewares (e.g. group 60 + login 5) don't share one hit bucket
		if !s.pubLimit.allow(fmt.Sprintf("pub:%s:%s:%d", ip, c.FullPath(), max), max, time.Minute) {
			httpx.Error(c.Writer, http.StatusTooManyRequests, "rate limited")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (s *Server) limitAI(c *gin.Context) {
	p := principal(c)
	key := p.UID
	if key == "" {
		key = c.ClientIP()
	}
	if !s.aiLimit.allow("ai:"+key, 20, time.Minute) {
		httpx.Error(c.Writer, http.StatusTooManyRequests, "rate limited")
		c.Abort()
		return
	}
	c.Next()
}
