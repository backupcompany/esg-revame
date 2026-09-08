package authn

import "testing"

func TestMintParseUAT(t *testing.T) {
	tok := MintUAT("secret", "uat-admin", "admin.uat@esg-together.test", "UAT Reviewer")
	p, ok := ParseUAT("secret", tok)
	if !ok || p.UID != "uat-admin" || p.Email != "admin.uat@esg-together.test" {
		t.Fatalf("%+v ok=%v", p, ok)
	}
	if _, ok := ParseUAT("other", tok); ok {
		t.Fatal("forged secret")
	}
	if _, ok := ParseUAT("secret", "v1.x.y"); ok {
		t.Fatal("junk")
	}
}

func TestUATByEmail(t *testing.T) {
	a, ok := UATByEmail("SUPER.UAT@esg-together.test")
	if !ok || a.Role != "super_admin" {
		t.Fatal(a, ok)
	}
	if _, ok := UATByEmail("heldra.p@gmail.com"); ok {
		t.Fatal("not a UAT mailbox")
	}
}

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
