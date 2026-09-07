package httpx

import (
	"encoding/json"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultLimit = 20
	MaxLimit     = 100
)

type Page struct {
	Limit  int
	Offset int
}

func ParsePage(r *http.Request) Page {
	limit := DefaultLimit
	offset := 0
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			offset = n
		}
	}
	if limit < 1 {
		limit = DefaultLimit
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}
	if offset < 0 {
		offset = 0
	}
	return Page{Limit: limit, Offset: offset}
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("httpx json encode: %v", err)
	}
}

// P is a Postgres placeholder index ($1, $2, …). n is never user input.
func P(n int) string {
	return "$" + strconv.Itoa(n)
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

func QueryFailed(w http.ResponseWriter) {
	Error(w, http.StatusInternalServerError, "query failed")
}

func ValidEmail(s string) bool {
	s = strings.TrimSpace(strings.ToLower(s))
	if s == "" || len(s) > 254 || strings.ContainsAny(s, " <>") {
		return false
	}
	a, err := mail.ParseAddress(s)
	if err != nil || !strings.EqualFold(a.Address, s) {
		return false
	}
	_, host, ok := strings.Cut(a.Address, "@")
	return ok && strings.Contains(host, ".")
}

func HTTPSURL(s string, max int) (string, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", true
	}
	if max <= 0 || len(s) > max || strings.ContainsAny(s, "\x00\r\n") {
		return "", false
	}
	if videoPath(s) {
		return "", false
	}
	// Same-origin static assets (e.g. /placeholder.svg). Not http, data, or protocol-relative.
	if strings.HasPrefix(s, "/") && !strings.HasPrefix(s, "//") {
		if strings.Contains(s, "..") || strings.Contains(s, "\\") || strings.Contains(s, "://") {
			return "", false
		}
		return s, true
	}
	u, err := url.Parse(s)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.User != nil {
		return "", false
	}
	if videoPath(u.Path) {
		return "", false
	}
	return s, true
}

func videoPath(p string) bool {
	p = strings.ToLower(p)
	if i := strings.IndexByte(p, '?'); i >= 0 {
		p = p[:i]
	}
	for _, ext := range []string{".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v", ".ogv"} {
		if strings.HasSuffix(p, ext) {
			return true
		}
	}
	return false
}

func Outbound(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
}
