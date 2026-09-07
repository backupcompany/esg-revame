package api

import "testing"

func TestLimiterAllow(t *testing.T) {
	l := newLimiter()
	if !l.allow("a", 2, 1<<62) {
		t.Fatal("first")
	}
	if !l.allow("a", 2, 1<<62) {
		t.Fatal("second")
	}
	if l.allow("a", 2, 1<<62) {
		t.Fatal("third should block")
	}
}
