package api

import (
	"net/http"
	"testing"
)

func TestIsLoopbackAndHTTPS(t *testing.T) {
	loop := &http.Request{RemoteAddr: "127.0.0.1:9", Header: http.Header{"X-Forwarded-Proto": []string{"https"}}}
	if !isLoopback(loop) || !isHTTPS(loop) {
		t.Fatal("loopback https proto")
	}
	ext := &http.Request{RemoteAddr: "203.0.113.8:9", Header: http.Header{"X-Forwarded-Proto": []string{"https"}}}
	if isLoopback(ext) || isHTTPS(ext) {
		t.Fatal("untrusted forwarded proto")
	}
}
