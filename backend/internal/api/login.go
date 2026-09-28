package api

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"esg-together/backend/internal/authn"
	"esg-together/backend/internal/httpx"
)

func (s *Server) demoPasswordLogin(c *gin.Context) {
	if !s.cfg.AllowDemo || s.cfg.TestPassword == "" {
		httpx.Error(c.Writer, http.StatusForbidden, "password login is demo-only")
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if !httpx.ValidEmail(email) {
		httpx.Error(c.Writer, http.StatusUnauthorized, "invalid email or password")
		return
	}
	okPass := s.demoPassHash != nil && bcrypt.CompareHashAndPassword(s.demoPassHash, []byte(body.Password)) == nil
	if !okPass {
		httpx.Error(c.Writer, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if s.cfg.DemoTestToken == "" {
		httpx.Error(c.Writer, http.StatusForbidden, "password login is demo-only")
		return
	}
	wantEmail := sha256.Sum256([]byte(s.cfg.TestEmail))
	gotEmail := sha256.Sum256([]byte(email))
	if subtle.ConstantTimeCompare(wantEmail[:], gotEmail[:]) == 1 {
		sessionCookieSet(c.Writer, c.Request, s.cfg.DemoTestToken)
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
		return
	}
	acct, ok := authn.UATByEmail(email)
	if !ok {
		httpx.Error(c.Writer, http.StatusUnauthorized, "invalid email or password")
		return
	}
	sessionCookieSet(c.Writer, c.Request, authn.MintUAT(s.cfg.DemoTestToken, acct.UID, acct.Email, acct.Name))
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}

func demoTokenIssued(allowDemo bool, token string) bool {
	return allowDemo && token != ""
}

func (s *Server) demoActors(c *gin.Context) {
	if !demoTokenIssued(s.cfg.AllowDemo, s.cfg.DemoTestToken) {
		httpx.Error(c.Writer, http.StatusForbidden, "demo-only")
		return
	}
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT u.email, COALESCE(u.name,''), COALESCE(u.role,'vendor_member'), COALESCE(v.company_name,'')
		FROM users u
		LEFT JOIN vendors v ON v.id = u.vendor_id
		WHERE u.email <> ''
		ORDER BY u.role, v.company_name, u.email
		LIMIT 40
	`)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, 8)
	for rows.Next() {
		var email, name, role, company string
		if rows.Scan(&email, &name, &role, &company) != nil {
			continue
		}
		list = append(list, gin.H{"email": email, "name": name, "role": role, "company": company})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"actors": list})
}

func (s *Server) demoEnterAs(c *gin.Context) {
	if !demoTokenIssued(s.cfg.AllowDemo, s.cfg.DemoTestToken) {
		httpx.Error(c.Writer, http.StatusForbidden, "demo-only")
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	var uid, name string
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT uid, COALESCE(name,'') FROM users WHERE lower(email) = $1
	`, email).Scan(&uid, &name)
	if err != nil || uid == "" {
		httpx.Error(c.Writer, http.StatusUnauthorized, "unknown user")
		return
	}
	sessionCookieSet(c.Writer, c.Request, authn.MintUAT(s.cfg.DemoTestToken, uid, email, name))
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}

func (s *Server) demoAdminEnter(c *gin.Context) {
	if !demoTokenIssued(s.cfg.AllowDemo, s.cfg.DemoAdminToken) {
		httpx.Error(c.Writer, http.StatusForbidden, "demo-only")
		return
	}
	sessionCookieSet(c.Writer, c.Request, s.cfg.DemoAdminToken)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}

func (s *Server) logout(c *gin.Context) {
	sessionCookieClear(c.Writer, c.Request)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}
