package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"esg-together/backend/internal/config"
)

func TestSecurityHeaders(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	h := New(config.Config{AllowDemo: true}, &pgxpool.Pool{})
	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/no-such", nil))
	if w.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("nosniff: %q", w.Header().Get("X-Content-Type-Options"))
	}
	if w.Header().Get("X-Frame-Options") != "DENY" {
		t.Fatal("frame")
	}
	if !strings.Contains(w.Header().Get("Content-Security-Policy"), "default-src 'none'") {
		t.Fatal("csp")
	}
	if w.Header().Get("Cross-Origin-Opener-Policy") != "same-origin" {
		t.Fatal("coop")
	}
	if w.Header().Get("Strict-Transport-Security") != "" {
		t.Fatal("hsts on plain http")
	}
}

func TestHSTSBehindHTTPSProxy(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	h := New(config.Config{AllowDemo: true}, &pgxpool.Pool{})
	req := httptest.NewRequest(http.MethodGet, "/no-such", nil)
	req.RemoteAddr = "127.0.0.1:1"
	req.Header.Set("X-Forwarded-Proto", "https")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Header().Get("Strict-Transport-Security") != "max-age=31536000; includeSubDomains" {
		t.Fatalf("hsts: %q", w.Header().Get("Strict-Transport-Security"))
	}
}

func TestHTTPSRequiredOffLoopback(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	h := New(config.Config{AllowDemo: false}, &pgxpool.Pool{})
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = "203.0.113.8:443"
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("code %d", w.Code)
	}
}

func TestDemoLoginSetsHttpOnlyCookie(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	h := New(config.Config{
		AllowDemo:     true,
		TestEmail:     "login@example.test",
		TestPassword:  "test-pass-1",
		DemoTestToken: "test-token",
	}, &pgxpool.Pool{})
	body := `{"email":"login@example.test","password":"test-pass-1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/public/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("code %d body %s", w.Code, w.Body.String())
	}
	if strings.Contains(w.Body.String(), "test-token") {
		t.Fatal("token must not be in JSON")
	}
	ck := w.Result().Cookies()
	var found *http.Cookie
	for _, c := range ck {
		if c.Name == sessionCookie {
			found = c
			break
		}
	}
	if found == nil || found.Value != "test-token" {
		t.Fatal("missing session cookie")
	}
	if !found.HttpOnly || found.SameSite != http.SameSiteStrictMode || found.Path != "/" {
		t.Fatalf("cookie flags %+v", found)
	}
	if found.Secure {
		t.Fatal("Secure on plain http")
	}
}

func TestRequireAuthCookieRejectedWhenDemoOff(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	h := New(config.Config{AllowDemo: false}, &pgxpool.Pool{})
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.RemoteAddr = "127.0.0.1:1"
	req.AddCookie(&http.Cookie{Name: sessionCookie, Value: "stolen"})
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("code %d", w.Code)
	}
}
