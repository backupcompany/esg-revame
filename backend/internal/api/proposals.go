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

var allowedProposalStatus = map[string]struct{}{
	"Pending": {}, "Approved": {}, "Rejected": {}, "Needs Revision": {},
}

func (s *Server) listProposals(c *gin.Context) {
	vendorID, user, ok := s.vendorScope(c)
	if !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	status := strings.TrimSpace(c.Query("status"))
	ctx := c.Request.Context()
	where := "TRUE"
	args := []any{}
	n := 1
	if !isAdmin(user.Role) {
		if vendorID == 0 {
			httpx.JSON(c.Writer, http.StatusOK, gin.H{"proposals": []any{}, "total": 0})
			return
		}
		where += " AND p.vendor_id = " + httpx.P(n)
		args = append(args, vendorID)
		n++
	}
	if status != "" && status != "ALL" {
		if _, ok := allowedProposalStatus[status]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
			return
		}
		where += " AND p.status = " + httpx.P(n)
		args = append(args, status)
		n++
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM proposed_actions p WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT p.id, p.vendor_id, v.company_name, p.title, p.description, p.pillar, p.category,
			p.difficulty, p.estimated_days, p.rationale, COALESCE(p.proposed_by_email,''),
			COALESCE(p.proposed_by_name,''), p.status, p.admin_feedback, p.approved_action_id,
			p.submitted_at, p.reviewed_at, COALESCE(ru.email, ru.name, '')
		FROM proposed_actions p
		JOIN vendors v ON v.id = p.vendor_id
		LEFT JOIN users ru ON ru.id = p.reviewed_by
		WHERE `+where+`
		ORDER BY p.submitted_at DESC
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, vendorID, days int
		var company, title, desc, pillar, email, name, st string
		var cat, diff, rationale *string
		var feedback, approved *string
		var submitted, reviewed any
		var reviewer string
		if rows.Scan(&id, &vendorID, &company, &title, &desc, &pillar, &cat, &diff, &days, &rationale,
			&email, &name, &st, &feedback, &approved, &submitted, &reviewed, &reviewer) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": strconv.Itoa(id), "vendorId": strconv.Itoa(vendorID), "vendorName": company,
			"title": title, "description": desc, "pillar": pillar, "category": deref(cat),
			"difficulty": deref(diff), "estimatedDays": days, "rationale": deref(rationale),
			"proposedByEmail": email, "proposedByName": name,
			"status": st, "adminFeedback": deref(feedback), "approvedActionId": deref(approved),
			"submittedAt": submitted, "reviewedAt": reviewed, "reviewedBy": reviewer,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"proposals": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) createProposal(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		Title         string `json:"title"`
		Description   string `json:"description"`
		Pillar        string `json:"pillar"`
		Category      string `json:"category"`
		Difficulty    string `json:"difficulty"`
		EstimatedDays int    `json:"estimatedDays"`
		Rationale     string `json:"rationale"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.Title = strings.TrimSpace(body.Title)
	body.Description = strings.TrimSpace(body.Description)
	body.Rationale = strings.TrimSpace(body.Rationale)
	if body.Title == "" || len(body.Title) > 200 {
		httpx.Error(c.Writer, http.StatusBadRequest, "title required")
		return
	}
	if len(body.Description) > 4000 || len(body.Rationale) > 4000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "text too long")
		return
	}
	if _, ok := allowedPillar[body.Pillar]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
		return
	}
	if body.Difficulty == "" {
		body.Difficulty = "Starter"
	}
	if _, ok := allowedDifficulty[body.Difficulty]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid difficulty")
		return
	}
	if body.EstimatedDays < 1 || body.EstimatedDays > 365 {
		body.EstimatedDays = 7
	}
	var id int
	err := s.db.QueryRow(c.Request.Context(), `
		INSERT INTO proposed_actions (
			vendor_id, title, description, pillar, category, difficulty, estimated_days,
			rationale, proposed_by_email, proposed_by_name, status
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending') RETURNING id
	`, *user.VendorID, body.Title, body.Description, body.Pillar, nullIfEmpty(body.Category),
		body.Difficulty, body.EstimatedDays, nullIfEmpty(body.Rationale), user.Email, user.Name).Scan(&id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "insert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": strconv.Itoa(id)})
}

func (s *Server) reviewProposal(c *gin.Context) {
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
		Status   string          `json:"status"`
		Feedback string          `json:"feedback"`
		Action   json.RawMessage `json:"action"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if _, ok := allowedProposalStatus[body.Status]; !ok || body.Status == "Pending" {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
		return
	}
	body.Feedback = strings.TrimSpace(body.Feedback)
	if len(body.Feedback) > 2000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "feedback too long")
		return
	}

	ctx := c.Request.Context()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer tx.Rollback(ctx)

	var vendorID int
	var title, desc, pillar string
	var cat, diff *string
	var days int
	err = tx.QueryRow(ctx, `
		SELECT vendor_id, title, description, pillar, category, difficulty, estimated_days
		FROM proposed_actions WHERE id = $1 FOR UPDATE
	`, id).Scan(&vendorID, &title, &desc, &pillar, &cat, &diff, &days)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "proposal not found")
		return
	}

	var approvedID any
	if body.Status == "Approved" {
		newID := "act_prop_" + strconv.FormatInt(time.Now().Unix(), 10) + "_" + strconv.Itoa(id)
		catName := deref(cat)
		if catName == "" {
			catName = "Partner Proposal"
		}
		diffName := deref(diff)
		if diffName == "" {
			diffName = "Starter"
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO action_catalog (
				id, title, description, pillar, category, difficulty, estimated_days,
				impact_metric_unit, impact_metric_label, default_metric_name, impact_multiplier,
				icon_name, practical_tips, practical_tips_id, required_evidence_type, points, is_active, source
			) VALUES (
				$1,$2,$3,$4,$5,$6,$7,'Units','Impact','energySavedKwh',10,'Sparkles',
				'["Follow agreed proposal plan"]','["Ikuti rencana inisiatif yang disetujui"]',
				'photo',100,true,'partner_proposal'
			)
		`, newID, title, desc, pillar, catName, diffName, days)
		if err != nil {
			httpx.Error(c.Writer, http.StatusInternalServerError, "catalog insert failed")
			return
		}
		approvedID = newID
	}

	_, err = tx.Exec(ctx, `
		UPDATE proposed_actions SET
			status = $2, admin_feedback = $3, reviewed_at = now(), reviewed_by = $4, approved_action_id = $5
		WHERE id = $1
	`, id, body.Status, nullIfEmpty(body.Feedback), actor.ID, approvedID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	if err := tx.Commit(ctx); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "approvedActionId": approvedID})
}
