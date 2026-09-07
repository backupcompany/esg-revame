package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"esg-together/backend/internal/httpx"
)

var allowedUploadMIME = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"application/pdf": ".pdf",
}

const maxEvidenceBytes = 10 << 20
const maxEvidenceFiles = 5

func (s *Server) commitAction(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		ActionID string `json:"actionId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ActionID = strings.TrimSpace(body.ActionID)
	if !catalogIDOK(body.ActionID) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid actionId")
		return
	}
	var title, pillar string
	var points int
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT title, pillar, points FROM action_catalog WHERE id = $1 AND is_active = true
	`, body.ActionID).Scan(&title, &pillar, &points)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "action not found")
		return
	}
	var id int
	var status string
	err = s.db.QueryRow(c.Request.Context(), `
		INSERT INTO vendor_actions (vendor_id, action_id, title, pillar, status, points)
		VALUES ($1,$2,$3,$4,'In Progress',$5)
		ON CONFLICT (vendor_id, action_id) DO UPDATE SET
			title = EXCLUDED.title,
			pillar = EXCLUDED.pillar
		RETURNING id, COALESCE(status,'In Progress')
	`, *user.VendorID, body.ActionID, title, pillar, points).Scan(&id, &status)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"success": true,
		"commitment": gin.H{
			"id": strconv.Itoa(id), "vendorId": strconv.Itoa(*user.VendorID),
			"actionId": body.ActionID, "status": status, "quantityReported": 1, "evidenceFiles": []any{},
			"committedDate": time.Now().UTC().Format("2006-01-02"),
		},
	})
}

func (s *Server) uploadEvidence(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	if err := c.Request.ParseMultipartForm(maxEvidenceBytes); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid multipart")
		return
	}
	notes := strings.TrimSpace(c.PostForm("notes"))
	if len(notes) > 4000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "notes too long")
		return
	}
	qty := 1.0
	if q := strings.TrimSpace(c.PostForm("quantityReported")); q != "" {
		v, err := strconv.ParseFloat(q, 64)
		if err != nil || v < 1 || v > 1e9 {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid quantityReported")
			return
		}
		qty = v
	}

	var existingID int
	err = s.db.QueryRow(c.Request.Context(), `
		SELECT id FROM vendor_actions WHERE id = $1 AND vendor_id = $2
	`, id, *user.VendorID).Scan(&existingID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "commitment not found")
		return
	}

	files := c.Request.MultipartForm.File["files"]
	if len(files) > maxEvidenceFiles {
		httpx.Error(c.Writer, http.StatusBadRequest, "max 5 files")
		return
	}

	var stored int
	_ = s.db.QueryRow(c.Request.Context(), `SELECT COUNT(*) FROM evidence_files WHERE vendor_action_id = $1`, id).Scan(&stored)
	if stored+len(files) < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "evidence file required")
		return
	}
	if stored+len(files) > 10 {
		httpx.Error(c.Writer, http.StatusBadRequest, "too many evidence files")
		return
	}

	ctx := c.Request.Context()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("rollback: %v", err)
		}
	}()

	var root *os.Root
	if len(files) > 0 {
		var rerr error
		root, rerr = os.OpenRoot(s.cfg.UploadDir)
		if rerr != nil {
			httpx.Error(c.Writer, http.StatusInternalServerError, "storage failed")
			return
		}
		defer closeFile(root)
	}

	written := make([]string, 0, len(files))
	for _, fh := range files {
		if fh.Size <= 0 || fh.Size > maxEvidenceBytes {
			httpx.Error(c.Writer, http.StatusBadRequest, "file too large")
			return
		}
		src, err := fh.Open()
		if err != nil {
			httpx.Error(c.Writer, http.StatusBadRequest, "cannot read file")
			return
		}
		head := make([]byte, 512)
		n, rerr := io.ReadFull(src, head)
		if rerr != nil && rerr != io.ErrUnexpectedEOF && rerr != io.EOF {
			closeFile(src)
			httpx.Error(c.Writer, http.StatusBadRequest, "cannot read file")
			return
		}
		mime := http.DetectContentType(head[:n])
		ext, ok := allowedUploadMIME[mime]
		if !ok || strings.HasPrefix(mime, "video/") {
			closeFile(src)
			httpx.Error(c.Writer, http.StatusBadRequest, "only jpeg, png, webp, pdf")
			return
		}
		fileType := "image"
		if mime == "application/pdf" {
			fileType = "document"
		}
		key, err := randomKey()
		if err != nil {
			closeFile(src)
			httpx.Error(c.Writer, http.StatusInternalServerError, "id failed")
			return
		}
		vdir := strconv.Itoa(*user.VendorID)
		if err := root.Mkdir(vdir, 0o700); err != nil && !errors.Is(err, fs.ErrExist) {
			closeFile(src)
			httpx.Error(c.Writer, http.StatusInternalServerError, "storage failed")
			return
		}
		rel := vdir + "/" + key + ext
		dst, err := root.OpenFile(rel, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
		if err != nil {
			closeFile(src)
			httpx.Error(c.Writer, http.StatusInternalServerError, "storage failed")
			return
		}
		if _, err := dst.Write(head[:n]); err != nil {
			closeFile(dst)
			closeFile(src)
			httpx.Error(c.Writer, http.StatusInternalServerError, "write failed")
			return
		}
		copied, err := io.Copy(dst, io.LimitReader(src, maxEvidenceBytes+1))
		if err != nil {
			closeFile(dst)
			closeFile(src)
			httpx.Error(c.Writer, http.StatusInternalServerError, "write failed")
			return
		}
		if int64(n)+copied > maxEvidenceBytes {
			closeFile(dst)
			closeFile(src)
			httpx.Error(c.Writer, http.StatusBadRequest, "file too large")
			return
		}
		closeFile(dst)
		closeFile(src)
		written = append(written, rel)

		name := strings.TrimSpace(filepath.Base(fh.Filename))
		name = strings.ReplaceAll(name, "\x00", "")
		if name == "." || name == "/" || name == "" || len(name) > 200 {
			name = "evidence" + ext
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO evidence_files (vendor_action_id, vendor_id, uploaded_by, file_name, storage_key, file_type, mime_type, size_bytes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		`, id, *user.VendorID, user.ID, name, rel, fileType, mime, fh.Size)
		if err != nil {
			httpx.Error(c.Writer, http.StatusInternalServerError, "index failed")
			return
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE vendor_actions SET
			notes = $2,
			quantity_reported = $3,
			status = 'Submitted',
			submitted_at = now()
		WHERE id = $1 AND vendor_id = $4
	`, id, nullIfEmpty(notes), qty, *user.VendorID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	if err := tx.Commit(ctx); err != nil {
		for _, rel := range written {
			if root != nil {
				if err := root.Remove(rel); err != nil {
					log.Printf("cleanup: %v", err)
				}
			}
		}
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": strconv.Itoa(id)})
}

func (s *Server) getEvidenceFile(c *gin.Context) {
	user, err := s.loadUser(c.Request.Context(), principal(c).UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var vendorID int
	var key, mime, name string
	err = s.db.QueryRow(c.Request.Context(), `
		SELECT vendor_id, storage_key, mime_type, file_name FROM evidence_files WHERE id = $1
	`, id).Scan(&vendorID, &key, &mime, &name)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	if !isAdmin(user.Role) {
		if user.VendorID == nil || *user.VendorID != vendorID {
			httpx.Error(c.Writer, http.StatusForbidden, "forbidden")
			return
		}
	}
	if strings.Contains(key, "..") || strings.HasPrefix(key, "/") {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid key")
		return
	}
	root, err := os.OpenRoot(s.cfg.UploadDir)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	defer closeFile(root)
	f, err := root.Open(filepath.ToSlash(key))
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	defer closeFile(f)
	st, err := f.Stat()
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	c.Header("Content-Type", mime)
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Disposition", `inline; filename="`+strings.ReplaceAll(filepath.Base(name), `"`, "")+`"`)
	http.ServeContent(c.Writer, c.Request, name, st.ModTime(), f)
}

func (s *Server) auditQueue(c *gin.Context) {
	if _, ok := s.requireAdmin(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	status := strings.TrimSpace(c.Query("status"))
	if status == "" {
		status = "Submitted"
	}
	if _, ok := allowedActionStatus[status]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
		return
	}
	q := strings.TrimSpace(c.Query("q"))
	if len(q) > 80 {
		q = q[:80]
	}
	ctx := c.Request.Context()
	where := `va.status = $1`
	args := []any{status}
	n := 2
	if q != "" {
		where += ` AND (v.company_name ILIKE ` + httpx.P(n) + ` ESCAPE '\' OR va.title ILIKE ` + httpx.P(n) + ` ESCAPE '\')`
		args = append(args, likeContains(q))
		n++
	}
	var total int
	_ = s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM vendor_actions va
		JOIN vendors v ON v.id = va.vendor_id
		WHERE `+where, args...).Scan(&total)

	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT va.id, va.vendor_id, v.company_name, va.action_id, va.title, va.pillar, va.status,
			COALESCE(va.notes,''), COALESCE(va.quantity_reported,1), va.submitted_at, va.created_at,
			COALESCE((
				SELECT json_agg(json_build_object(
					'id', ef.id::text,
					'fileName', ef.file_name,
					'fileUrl', '/api/evidence/' || ef.id,
					'fileType', ef.file_type,
					'uploadedAt', ef.uploaded_at
				) ORDER BY ef.id)
				FROM evidence_files ef WHERE ef.vendor_action_id = va.id
			), '[]'::json)
		FROM vendor_actions va
		JOIN vendors v ON v.id = va.vendor_id
		WHERE `+where+`
		ORDER BY va.submitted_at DESC NULLS LAST, va.id DESC
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, vendorID int
		var company, actionID, title, pillar, st, notes string
		var qty float32
		var submitted, created any
		var files []byte
		if rows.Scan(&id, &vendorID, &company, &actionID, &title, &pillar, &st, &notes, &qty, &submitted, &created, &files) != nil {
			continue
		}
		list = append(list, gin.H{
			"vendorName":  company,
			"actionTitle": title,
			"commitment": gin.H{
				"id": strconv.Itoa(id), "vendorId": strconv.Itoa(vendorID), "actionId": actionID,
				"status": st, "notes": notes, "quantityReported": qty,
				"committedDate": created, "submittedAt": submitted,
				"evidenceFiles": jsonRaw(files),
			},
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"items": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) reviewCommitment(c *gin.Context) {
	actor, ok := s.requireAdmin(c)
	if !ok {
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Status   string `json:"status"`
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if body.Status != "Verified" && body.Status != "Needs Info" {
		httpx.Error(c.Writer, http.StatusBadRequest, "status must be Verified or Needs Info")
		return
	}
	body.Feedback = strings.TrimSpace(body.Feedback)
	if len(body.Feedback) > 2000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "feedback too long")
		return
	}
	tag, err := s.db.Exec(c.Request.Context(), `
		UPDATE vendor_actions SET
			status = $2,
			verification_feedback = $3,
			verified_by = $4,
			verified_at = CASE WHEN $2 = 'Verified' THEN now() ELSE verified_at END
		WHERE id = $1 AND status IN ('Submitted','Needs Info','In Progress')
	`, id, body.Status, nullIfEmpty(body.Feedback), actor.Email)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.Error(c.Writer, http.StatusNotFound, "commitment not found or already closed")
		return
	}
	s.writeAudit(c.Request.Context(), actor.ID, "evidence_verify", "vendor_action", strconv.Itoa(id), nil, body.Status)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func closeFile(c io.Closer) {
	if err := c.Close(); err != nil {
		log.Printf("close: %v", err)
	}
}

func randomKey() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func jsonRaw(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage("[]")
	}
	return json.RawMessage(b)
}

func jsonObj(b []byte) any {
	if len(b) == 0 {
		return nil
	}
	return json.RawMessage(b)
}
