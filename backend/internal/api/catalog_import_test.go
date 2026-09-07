package api

import "testing"

func TestParseCatalogCaseInsensitive(t *testing.T) {
	table := [][]string{
		{"judul aksi (bahasa indonesia)*", "pilar (e/s/g)*", "poin penghargaan (pts)*"},
		{"Lampu LED", "e", "90"},
	}
	out := parseCatalogRows(table)
	if len(out) != 1 {
		t.Fatalf("rows=%d", len(out))
	}
	if out[0]["titleId"] != "Lampu LED" {
		t.Fatalf("titleId=%v", out[0]["titleId"])
	}
	if out[0]["pillar"] != "E" {
		t.Fatalf("pillar=%v", out[0]["pillar"])
	}
	if out[0]["points"] != 90 {
		t.Fatalf("points=%v", out[0]["points"])
	}
}
