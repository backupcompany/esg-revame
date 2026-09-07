package authn

import "testing"

func TestTokenEq(t *testing.T) {
	if tokenEq("", "x") || tokenEq("x", "") || tokenEq("", "") {
		t.Fatal("empty must not match")
	}
	if !tokenEq("tok", "tok") {
		t.Fatal("equal")
	}
	if tokenEq("tok", "tok2") {
		t.Fatal("mismatch")
	}
}
