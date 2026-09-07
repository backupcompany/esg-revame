package api

import "testing"

func TestDemoTokenIssued(t *testing.T) {
	if demoTokenIssued(false, "tok") {
		t.Fatal("prod must not issue demo token")
	}
	if demoTokenIssued(true, "") {
		t.Fatal("empty token must not issue")
	}
	if !demoTokenIssued(true, "tok") {
		t.Fatal("demo+token ok")
	}
}
