package api

import (
	"encoding/json"
	"testing"
)

func TestSanitizeLessonAssetsRejectsVideo(t *testing.T) {
	in := json.RawMessage(`[{"mediaUrl":"https://x.example/a.mp4","mediaType":"video"},{"mediaUrl":"/placeholder.svg"}]`)
	out := sanitizeLessonAssets(in)
	var lessons []map[string]any
	if err := json.Unmarshal(out, &lessons); err != nil || len(lessons) != 2 {
		t.Fatal(err)
	}
	if _, ok := lessons[0]["mediaUrl"]; ok {
		t.Fatal("mp4 must drop")
	}
	if lessons[0]["mediaType"] != "image" {
		t.Fatal("no video type")
	}
	if lessons[1]["mediaUrl"] != "/placeholder.svg" {
		t.Fatal("placeholder")
	}
}

func TestSpreadsheetMagicOK(t *testing.T) {
	if spreadsheetMagicOK("x.xlsx", []byte("not-zip")) || !spreadsheetMagicOK("x.xlsx", []byte("PK\x03\x04")) {
		t.Fatal("xlsx")
	}
	if spreadsheetMagicOK("x.csv", []byte("PK\x03\x04")) {
		t.Fatal("csv vs zip")
	}
}
