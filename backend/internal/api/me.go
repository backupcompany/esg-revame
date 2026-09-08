package api

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"esg-together/backend/internal/httpx"
)

var errNotInvited = errors.New("not_invited")

func (s *Server) me(c *gin.Context) {
	raw := bearerOrCookie(c)
	if raw == "" {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"user": nil, "vendor": nil})
		return
	}
	p, err := s.auth.Verify(c.Request.Context(), raw)
	if err != nil {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"user": nil, "vendor": nil})
		return
	}

	ctx := c.Request.Context()
	email := strings.ToLower(strings.TrimSpace(p.Email))
	name := strings.TrimSpace(p.Name)
	if name == "" && email != "" {
		name = strings.Split(email, "@")[0]
	}

	user, err := s.upsertIdentity(ctx, p.UID, email, name)
	if err != nil {
		if errors.Is(err, errNotInvited) {
			httpx.Error(c.Writer, http.StatusForbidden, "not_invited")
			return
		}
		httpx.Error(c.Writer, http.StatusInternalServerError, "auth sync failed")
		return
	}

	var vendor any
	if user.VendorID != nil {
		if v, err := s.getVendorByID(ctx, *user.VendorID); err == nil {
			vendor = v
		}
	}

	lang := "ID"
	_ = s.db.QueryRow(ctx, `SELECT COALESCE(preferred_lang,'ID') FROM users WHERE id = $1`, user.ID).Scan(&lang)

	httpx.JSON(c.Writer, http.StatusOK, gin.H{"user": gin.H{
		"id": user.ID, "uid": user.UID, "email": user.Email, "name": user.Name,
		"role": user.Role, "vendorId": user.VendorID, "preferredLang": lang,
	}, "vendor": vendor})
}

func (s *Server) setPreferences(c *gin.Context) {
	p := principal(c)
	user, err := s.loadUser(c.Request.Context(), p.UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	var body struct {
		Lang string `json:"lang"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	lang := strings.ToUpper(strings.TrimSpace(body.Lang))
	if lang != "ID" && lang != "EN" {
		httpx.Error(c.Writer, http.StatusBadRequest, "lang must be ID or EN")
		return
	}
	_, err = s.db.Exec(c.Request.Context(), `UPDATE users SET preferred_lang = $2 WHERE id = $1`, user.ID, lang)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "preferredLang": lang})
}

func (s *Server) upsertIdentity(ctx context.Context, uid, email, name string) (*dbUser, error) {
	var u dbUser
	err := s.db.QueryRow(ctx, `
		SELECT id, uid, email, COALESCE(name,''), COALESCE(role,'vendor_member'), vendor_id
		FROM users WHERE uid = $1
	`, uid).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	found := err == nil

	if !found && email != "" {
		err = s.db.QueryRow(ctx, `
			SELECT id, uid, email, COALESCE(name,''), COALESCE(role,'vendor_member'), vendor_id
			FROM users WHERE lower(email) = $1
			LIMIT 1
		`, email).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
		if err == nil {
			found = true
			if u.UID != uid {
				_, _ = s.db.Exec(ctx, `UPDATE users SET uid = $1 WHERE id = $2`, uid, u.ID)
				u.UID = uid
			}
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
	}

	_, isBootAdmin := s.cfg.SuperAdminEmails[email]
	if s.cfg.AllowDemo && s.cfg.DemoAdminUID != "" && uid == s.cfg.DemoAdminUID {
		isBootAdmin = true
	}

	var allowedVendor *int
	if email != "" {
		var vid int
		err = s.db.QueryRow(ctx, `
			SELECT vendor_id FROM vendor_allowed_emails WHERE lower(email) = $1 LIMIT 1
		`, email).Scan(&vid)
		if err == nil {
			allowedVendor = &vid
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
	}

	if allowedVendor == nil && s.cfg.AllowDemo && s.cfg.DemoTestUID != "" && uid == s.cfg.DemoTestUID {
		var vid int
		if s.db.QueryRow(ctx, `SELECT id FROM vendors ORDER BY id LIMIT 1`).Scan(&vid) == nil {
			allowedVendor = &vid
		}
	}

	adminOK := isBootAdmin || (found && isAdmin(u.Role))
	if !rosterAllows(s.cfg.EnforceAllowlist, adminOK, allowedVendor != nil) {
		return nil, errNotInvited
	}

	if isBootAdmin {
		if !found {
			err = s.db.QueryRow(ctx, `
				INSERT INTO users (uid, email, name, role)
				VALUES ($1, $2, $3, $4)
				RETURNING id, uid, email, COALESCE(name,''), role, vendor_id
			`, uid, email, name, roleSuperAdmin).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
			return &u, err
		}
		err = s.db.QueryRow(ctx, `
			UPDATE users SET role = $4, email = $2, name = COALESCE(NULLIF($3,''), name)
			WHERE id = $1
			RETURNING id, uid, email, COALESCE(name,''), role, vendor_id
		`, u.ID, email, name, roleSuperAdmin).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
		return &u, err
	}

	if !found {
		role := roleVendorMember
		if allowedVendor != nil {
			var n int
			_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE vendor_id = $1`, *allowedVendor).Scan(&n)
			if n == 0 {
				role = roleVendorAdmin
			}
		}
		err = s.db.QueryRow(ctx, `
			INSERT INTO users (uid, email, name, role, vendor_id)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, uid, email, COALESCE(name,''), role, vendor_id
		`, uid, email, name, role, allowedVendor).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
		return &u, err
	}

	if allowedVendor != nil && !isAdmin(u.Role) && (u.VendorID == nil || *u.VendorID != *allowedVendor) {
		err = s.db.QueryRow(ctx, `
			UPDATE users SET vendor_id = $2 WHERE id = $1
			RETURNING id, uid, email, COALESCE(name,''), role, vendor_id
		`, u.ID, *allowedVendor).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
		return &u, err
	}
	return &u, nil
}
