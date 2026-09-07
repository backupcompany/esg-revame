package config

import "testing"

func TestProdSSLDefault(t *testing.T) {
	if sqlSSL("", false) != "require" {
		t.Fatal("prod empty → require")
	}
	if sqlSSL("disable", false) != "disable" {
		t.Fatal("explicit disable kept")
	}
	if sqlSSL("", true) != "" {
		t.Fatal("demo empty stays empty")
	}
}

func TestOutboundURLsFromEnv(t *testing.T) {
	t.Setenv("FIREBASE_ACCOUNTS_LOOKUP_URL", "")
	t.Setenv("GEMINI_GENERATE_URL", "")
	cfg := Load()
	if cfg.FirebaseLookupURL != "" || cfg.GeminiGenerateURL != "" {
		t.Fatal("google endpoints must come from env, no source fallback")
	}
	t.Setenv("FIREBASE_ACCOUNTS_LOOKUP_URL", "https://example.test/lookup?key=")
	t.Setenv("GEMINI_GENERATE_URL", "https://example.test/gemini?key=")
	cfg = Load()
	if cfg.FirebaseLookupURL != "https://example.test/lookup?key=" {
		t.Fatal("lookup url")
	}
	if cfg.GeminiGenerateURL != "https://example.test/gemini?key=" {
		t.Fatal("gemini url")
	}
}
