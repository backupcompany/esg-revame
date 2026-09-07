package httpx

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestValidEmail(t *testing.T) {
	if !ValidEmail("a@siloam.example") {
		t.Fatal("ok")
	}
	if ValidEmail("not-an-email") || ValidEmail("a@b") || ValidEmail("Name <a@b.co>") {
		t.Fatal("reject")
	}
}

func TestHTTPSURL(t *testing.T) {
	got, ok := HTTPSURL("https://images.example/x.png", 500)
	if !ok || got == "" {
		t.Fatal("https ok")
	}
	if _, ok := HTTPSURL("http://images.example/x.png", 500); ok {
		t.Fatal("http")
	}
	if _, ok := HTTPSURL("https://user:pass@evil.example/x", 500); ok {
		t.Fatal("userinfo")
	}
	if _, ok := HTTPSURL("", 500); !ok {
		t.Fatal("empty allowed")
	}
	got, ok = HTTPSURL("  /placeholder.svg  ", 500)
	if !ok || got != "/placeholder.svg" {
		t.Fatal("local asset")
	}
	if _, ok := HTTPSURL("javascript:alert(1)", 500); ok {
		t.Fatal("javascript")
	}
	if _, ok := HTTPSURL("https://cdn.example/clip.mp4", 500); ok {
		t.Fatal("video")
	}
	if _, ok := HTTPSURL("/../../etc/passwd", 500); ok {
		t.Fatal("dotdot")
	}
}

func TestOutboundNoRedirect(t *testing.T) {
	final := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "leaked")
	}))
	defer final.Close()
	start := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, final.URL, http.StatusFound)
	}))
	defer start.Close()
	res, err := Outbound(2 * time.Second).Get(start.URL)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusFound {
		t.Fatalf("followed redirect: %d", res.StatusCode)
	}
}

func FuzzValidEmail(f *testing.F) {
	f.Add("a@siloam.example")
	f.Add("")
	f.Add("not-an-email")
	f.Fuzz(func(t *testing.T, s string) {
		_ = ValidEmail(s)
	})
}

func FuzzHTTPSURL(f *testing.F) {
	f.Add("https://x.example/a")
	f.Add("http://x.example/a")
	f.Add("")
	f.Fuzz(func(t *testing.T, s string) {
		_, _ = HTTPSURL(s, 500)
	})
}
