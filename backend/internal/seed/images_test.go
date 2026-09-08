package seed

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestActionCatalogImagesUnique(t *testing.T) {
	var rows []struct {
		ID       string `json:"id"`
		ImageURL string `json:"imageUrl"`
		Pillar   string `json:"pillar"`
	}
	if err := json.Unmarshal(actionsJSON, &rows); err != nil {
		t.Fatal(err)
	}
	if len(rows) < 12 {
		t.Fatalf("want >=12 actions, got %d", len(rows))
	}
	broken := []string{"photo-1509391365360", "photo-1581092335397"}
	seen := map[string]string{}
	for _, r := range rows {
		if r.ImageURL == "" {
			t.Fatalf("%s missing imageUrl", r.ID)
		}
		if r.Pillar != "E" && r.Pillar != "S" && r.Pillar != "G" {
			t.Fatalf("%s bad pillar %s", r.ID, r.Pillar)
		}
		for _, b := range broken {
			if strings.Contains(r.ImageURL, b) {
				t.Fatalf("%s still uses broken photo %s", r.ID, b)
			}
		}
		if prev, ok := seen[r.ImageURL]; ok {
			t.Fatalf("duplicate imageUrl on %s and %s", prev, r.ID)
		}
		seen[r.ImageURL] = r.ID
	}
}
