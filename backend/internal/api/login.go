package api

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

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
	wantEmail := sha256.Sum256([]byte(s.cfg.TestEmail))
	gotEmail := sha256.Sum256([]byte(email))
	okEmail := subtle.ConstantTimeCompare(wantEmail[:], gotEmail[:]) == 1
	okPass := s.demoPassHash != nil && bcrypt.CompareHashAndPassword(s.demoPassHash, []byte(body.Password)) == nil
	if !okEmail || !okPass {
		httpx.Error(c.Writer, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if s.cfg.DemoTestToken == "" {
		httpx.Error(c.Writer, http.StatusForbidden, "password login is demo-only")
		return
	}
	sessionCookieSet(c.Writer, c.Request, s.cfg.DemoTestToken)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}

func demoTokenIssued(allowDemo bool, token string) bool {
	return allowDemo && token != ""
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
