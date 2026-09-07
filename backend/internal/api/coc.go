package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func (s *Server) currentCoC(c *gin.Context) {
	var version, titleID, titleEN string
	var clauses []byte
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT version, title_id, title_en, clauses FROM coc_versions WHERE is_current = true LIMIT 1
	`).Scan(&version, &titleID, &titleEN, &clauses)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "no current CoC version")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"version": version, "titleId": titleID, "titleEn": titleEN, "clauses": json.RawMessage(nzJSON(clauses)),
	})
}

func (s *Server) listDeclarations(c *gin.Context) {
	vendorID, user, ok := s.vendorScope(c)
	if !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	where := "1=1"
	args := []any{}
	n := 1
	if !isAdmin(user.Role) || vendorID > 0 {
		if vendorID == 0 {
			httpx.JSON(c.Writer, http.StatusOK, gin.H{"declarations": []any{}, "total": 0, "latest": nil})
			return
		}
		where = "vendor_id = $1"
		args = append(args, vendorID)
		n = 2
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM coc_declarations WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT id, vendor_id, vendor_name, signer_name, signer_title, signer_address,
			version, signature_confirmed, status, declared_at, valid_until
		FROM coc_declarations WHERE `+where+`
		ORDER BY declared_at DESC
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		item, ok := scanDecl(rows)
		if ok {
			list = append(list, item)
		}
	}
	var latest any
	if len(list) > 0 {
		latest = list[0]
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"declarations": list, "latest": latest, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) signCoC(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		SignerName         string `json:"signerName"`
		SignerTitle        string `json:"signerTitle"`
		SignerAddress      string `json:"signerAddress"`
		SignatureConfirmed bool   `json:"signatureConfirmed"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if !body.SignatureConfirmed {
		httpx.Error(c.Writer, http.StatusBadRequest, "signature must be confirmed")
		return
	}
	body.SignerName = strings.TrimSpace(body.SignerName)
	body.SignerTitle = strings.TrimSpace(body.SignerTitle)
	body.SignerAddress = strings.TrimSpace(body.SignerAddress)
	if body.SignerName == "" || body.SignerTitle == "" || body.SignerAddress == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "signer fields required")
		return
	}
	if len(body.SignerName) > 120 || len(body.SignerTitle) > 120 || len(body.SignerAddress) > 300 {
		httpx.Error(c.Writer, http.StatusBadRequest, "signer fields too long")
		return
	}

	ctx := c.Request.Context()
	var version, company string
	err := s.db.QueryRow(ctx, `SELECT version FROM coc_versions WHERE is_current = true LIMIT 1`).Scan(&version)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "no current CoC version")
		return
	}
	_ = s.db.QueryRow(ctx, `SELECT company_name FROM vendors WHERE id = $1`, *user.VendorID).Scan(&company)
	if company == "" {
		company = "Vendor"
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer tx.Rollback(ctx)
	_, _ = tx.Exec(ctx, `
		UPDATE coc_declarations SET status = 'expired'
		WHERE vendor_id = $1 AND status = 'active'
	`, *user.VendorID)
	var id int
	validUntil := time.Now().AddDate(1, 0, 0)
	err = tx.QueryRow(ctx, `
		INSERT INTO coc_declarations (
			vendor_id, user_id, vendor_name, signer_name, signer_title, signer_address,
			version, signature_confirmed, status, valid_until
		) VALUES ($1,$2,$3,$4,$5,$6,$7,true,'active',$8)
		RETURNING id
	`, *user.VendorID, user.ID, company, body.SignerName, body.SignerTitle, body.SignerAddress, version, validUntil).Scan(&id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "sign failed")
		return
	}
	if err := tx.Commit(ctx); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	s.writeAudit(ctx, user.ID, "coc_sign", "declaration", strconv.Itoa(id), nil, version)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"success": true,
		"declaration": gin.H{
			"id": strconv.Itoa(id), "vendorId": strconv.Itoa(*user.VendorID), "vendorName": company,
			"signerName": body.SignerName, "signerTitle": body.SignerTitle, "signerAddress": body.SignerAddress,
			"signatureConfirmed": true, "status": "active", "version": version,
			"declaredDate": time.Now().UTC().Format(time.RFC3339),
			"validUntil":   validUntil.UTC().Format(time.RFC3339),
		},
	})
}

func (s *Server) publishCoCVersion(c *gin.Context) {
	user, ok := s.requireAdmin(c)
	if !ok {
		return
	}
	var body struct {
		Version string          `json:"version"`
		TitleID string          `json:"titleId"`
		TitleEN string          `json:"titleEn"`
		Clauses json.RawMessage `json:"clauses"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.Version = strings.TrimSpace(body.Version)
	if body.Version == "" || len(body.Version) > 32 || !json.Valid(body.Clauses) || len(body.Clauses) > 32<<10 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid version payload")
		return
	}
	if body.TitleID == "" {
		body.TitleID = "Surat Pernyataan Kode Etik Pemasok"
	}
	if body.TitleEN == "" {
		body.TitleEN = "Supplier Code of Conduct Declaration"
	}
	ctx := c.Request.Context()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `UPDATE coc_versions SET is_current = false WHERE is_current = true`)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO coc_versions (version, title_id, title_en, clauses, is_current, published_by)
		VALUES ($1,$2,$3,$4,true,$5)
		ON CONFLICT (version) DO UPDATE SET
			title_id=EXCLUDED.title_id, title_en=EXCLUDED.title_en, clauses=EXCLUDED.clauses,
			is_current=true, published_at=now(), published_by=EXCLUDED.published_by
	`, body.Version, body.TitleID, body.TitleEN, body.Clauses, user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "insert failed")
		return
	}
	_, _ = tx.Exec(ctx, `
		UPDATE coc_declarations SET status = 'pending_renewal'
		WHERE status = 'active' AND version <> $1
	`, body.Version)
	if err := tx.Commit(ctx); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	s.writeAudit(ctx, user.ID, "coc_publish", "coc_version", body.Version, nil, true)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "version": body.Version})
}

func scanDecl(rows interface{ Scan(dest ...any) error }) (gin.H, bool) {
	var id, vendorID int
	var company, signer, title, addr, version, status string
	var confirmed bool
	var declared, until any
	if rows.Scan(&id, &vendorID, &company, &signer, &title, &addr, &version, &confirmed, &status, &declared, &until) != nil {
		return nil, false
	}
	return gin.H{
		"id": strconv.Itoa(id), "vendorId": strconv.Itoa(vendorID), "vendorName": company,
		"signerName": signer, "signerTitle": title, "signerAddress": addr,
		"version": version, "signatureConfirmed": confirmed, "status": status,
		"declaredDate": declared, "validUntil": until,
	}, true
}
