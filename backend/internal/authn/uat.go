package authn

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"strings"
)

type UATAccount struct {
	UID    string
	Email  string
	Name   string
	Role   string
	Vendor bool
}

// UATAccounts is the invite-only password roster for local + live demo.
var UATAccounts = []UATAccount{
	{UID: "uat-super-admin", Email: "super.uat@esg-together.test", Name: "UAT Super Admin", Role: "super_admin"},
	{UID: "uat-admin", Email: "admin.uat@esg-together.test", Name: "UAT Reviewer", Role: "admin"},
	{UID: "uat-vendor-pic", Email: "pic.uat@esg-together.test", Name: "UAT PIC", Role: "vendor_admin", Vendor: true},
	{UID: "uat-vendor-member", Email: "staff.uat@esg-together.test", Name: "UAT Staff", Role: "vendor_member", Vendor: true},
}

func UATByEmail(email string) (UATAccount, bool) {
	email = strings.ToLower(strings.TrimSpace(email))
	for _, a := range UATAccounts {
		if a.Email == email {
			return a, true
		}
	}
	return UATAccount{}, false
}

func MintUAT(secret, uid, email, name string) string {
	payload := uid + "\n" + email + "\n" + name
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	enc := base64.RawURLEncoding
	return "v1." + enc.EncodeToString([]byte(payload)) + "." + enc.EncodeToString(mac.Sum(nil))
}

func ParseUAT(secret, raw string) (Principal, bool) {
	if secret == "" || !strings.HasPrefix(raw, "v1.") {
		return Principal{}, false
	}
	parts := strings.Split(raw, ".")
	if len(parts) != 3 {
		return Principal{}, false
	}
	enc := base64.RawURLEncoding
	payload, err := enc.DecodeString(parts[1])
	if err != nil {
		return Principal{}, false
	}
	want, err := enc.DecodeString(parts[2])
	if err != nil {
		return Principal{}, false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	if !hmac.Equal(mac.Sum(nil), want) {
		return Principal{}, false
	}
	fields := strings.SplitN(string(payload), "\n", 3)
	if len(fields) != 3 || fields[0] == "" || fields[1] == "" {
		return Principal{}, false
	}
	return Principal{UID: fields[0], Email: fields[1], Name: fields[2]}, true
}
