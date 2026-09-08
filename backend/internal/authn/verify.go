package authn

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"esg-together/backend/internal/config"
	"esg-together/backend/internal/httpx"
)

var ErrInvalidToken = errors.New("invalid token")

type Principal struct {
	UID   string
	Email string
	Name  string
}

type Verifier struct {
	cfg    config.Config
	client *http.Client
}

func NewVerifier(cfg config.Config) *Verifier {
	return &Verifier{
		cfg:    cfg,
		client: httpx.Outbound(8 * time.Second),
	}
}

func (v *Verifier) Verify(ctx context.Context, raw string) (Principal, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return Principal{}, ErrInvalidToken
	}
	if v.cfg.AllowDemo {
		if tokenEq(raw, v.cfg.DemoAdminToken) {
			return Principal{
				UID:   v.cfg.DemoAdminUID,
				Email: v.cfg.DemoAdminEmail,
				Name:  v.cfg.DemoAdminName,
			}, nil
		}
		if tokenEq(raw, v.cfg.DemoTestToken) {
			email := v.cfg.TestEmail
			if email == "" {
				email = v.cfg.DemoAdminEmail
			}
			return Principal{
				UID:   v.cfg.DemoTestUID,
				Email: email,
				Name:  v.cfg.DemoTestName,
			}, nil
		}
		if p, ok := ParseUAT(v.cfg.DemoTestToken, raw); ok {
			return p, nil
		}
	}
	if v.cfg.FirebaseWebAPIKey == "" || v.cfg.FirebaseLookupURL == "" {
		return Principal{}, fmt.Errorf("firebase web api key missing")
	}

	body, err := json.Marshal(map[string]string{"idToken": raw})
	if err != nil {
		return Principal{}, ErrInvalidToken
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		v.cfg.FirebaseLookupURL+v.cfg.FirebaseWebAPIKey,
		bytes.NewReader(body),
	)
	if err != nil {
		return Principal{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := v.client.Do(req)
	if err != nil {
		return Principal{}, err
	}
	defer res.Body.Close()
	payload, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return Principal{}, ErrInvalidToken
	}
	if res.StatusCode != http.StatusOK {
		return Principal{}, ErrInvalidToken
	}

	var parsed struct {
		Users []struct {
			LocalID     string `json:"localId"`
			Email       string `json:"email"`
			DisplayName string `json:"displayName"`
		} `json:"users"`
	}
	if err := json.Unmarshal(payload, &parsed); err != nil || len(parsed.Users) == 0 {
		return Principal{}, ErrInvalidToken
	}
	u := parsed.Users[0]
	name := u.DisplayName
	if name == "" && u.Email != "" {
		name = strings.Split(u.Email, "@")[0]
	}
	return Principal{UID: u.LocalID, Email: strings.ToLower(strings.TrimSpace(u.Email)), Name: name}, nil
}

func tokenEq(got, want string) bool {
	if got == "" || want == "" {
		return false
	}
	a := sha256.Sum256([]byte(got))
	b := sha256.Sum256([]byte(want))
	return subtle.ConstantTimeCompare(a[:], b[:]) == 1
}
