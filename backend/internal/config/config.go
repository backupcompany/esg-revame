package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	HTTPAddr          string
	SQLHost           string
	SQLPort           string
	SQLUser           string
	SQLPassword       string
	SQLDBName         string
	SQLSSLMode        string
	AllowDemo         bool
	EnforceAllowlist  bool
	SuperAdminEmails  map[string]struct{}
	FirebaseProjectID string
	FirebaseWebAPIKey string
	FirebaseLookupURL string
	UploadDir         string
	GeminiAPIKey      string
	GeminiGenerateURL string
	GeminiModel       string
	TestEmail         string
	TestPassword      string
	DemoAdminToken    string
	DemoAdminUID      string
	DemoAdminEmail    string
	DemoAdminName     string
	DemoTestToken     string
	DemoTestUID       string
	DemoTestName      string
}

func Load() Config {
	admins := map[string]struct{}{}
	for _, e := range strings.Split(env("ESG_SUPER_ADMIN_EMAILS", ""), ",") {
		e = strings.ToLower(strings.TrimSpace(e))
		if e != "" {
			admins[e] = struct{}{}
		}
	}

	addr := env("API_ADDR", "")
	if addr == "" {
		addr = ":" + env("API_PORT", "8080")
	}
	cfg := Config{
		HTTPAddr:          addr,
		SQLHost:           env("SQL_HOST", "localhost"),
		SQLPort:           env("SQL_PORT", "5432"),
		SQLUser:           env("SQL_USER", "esg_together"),
		SQLPassword:       os.Getenv("SQL_PASSWORD"),
		SQLDBName:         env("SQL_DB_NAME", "esg_together"),
		SQLSSLMode:        env("SQL_SSLMODE", ""),
		AllowDemo:         envBool("ESG_ALLOW_DEMO", false),
		EnforceAllowlist:  envBool("ESG_ENFORCE_ALLOWLIST", true),
		SuperAdminEmails:  admins,
		FirebaseProjectID: env("FIREBASE_PROJECT_ID", ""),
		FirebaseWebAPIKey: env("FIREBASE_WEB_API_KEY", ""),
		FirebaseLookupURL: env("FIREBASE_ACCOUNTS_LOOKUP_URL", ""),
		UploadDir:         env("ESG_UPLOAD_DIR", "data/uploads"),
		GeminiAPIKey:      env("GEMINI_API_KEY", ""),
		GeminiGenerateURL: env("GEMINI_GENERATE_URL", ""),
		GeminiModel:       env("GEMINI_MODEL", "gemini-2.0-flash"),
		TestEmail:         strings.ToLower(env("ESG_TEST_EMAIL", "")),
		TestPassword:      env("ESG_TEST_PASSWORD", ""),
		DemoAdminToken:    env("ESG_DEMO_ADMIN_TOKEN", ""),
		DemoAdminUID:      env("ESG_DEMO_ADMIN_UID", ""),
		DemoAdminEmail:    strings.ToLower(env("ESG_DEMO_ADMIN_EMAIL", "")),
		DemoAdminName:     env("ESG_DEMO_ADMIN_NAME", "Demo Admin"),
		DemoTestToken:     env("ESG_DEMO_TEST_TOKEN", ""),
		DemoTestUID:       env("ESG_DEMO_TEST_UID", ""),
		DemoTestName:      env("ESG_DEMO_TEST_NAME", "Demo User"),
	}
	cfg.SQLSSLMode = sqlSSL(cfg.SQLSSLMode, cfg.AllowDemo)
	return cfg
}

func sqlSSL(mode string, allowDemo bool) string {
	if mode == "" && !allowDemo {
		return "require"
	}
	return mode
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
