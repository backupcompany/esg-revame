package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

var allowedPillar = map[string]struct{}{"E": {}, "S": {}, "G": {}}
var allowedActionStatus = map[string]struct{}{
	"Not Started": {}, "In Progress": {}, "Submitted": {}, "Verified": {}, "Needs Info": {},
}

func (s *Server) vendorScope(c *gin.Context) (vendorID int, user *dbUser, ok bool) {
	p := principal(c)
	u, err := s.loadUser(c.Request.Context(), p.UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return 0, nil, false
	}
	if isAdmin(u.Role) {
		q := strings.TrimSpace(c.Query("vendorId"))
		if q != "" {
			id, err := strconv.Atoi(q)
			if err != nil || id < 1 {
				httpx.Error(c.Writer, http.StatusBadRequest, "invalid vendorId")
				return 0, nil, false
			}
			return id, u, true
		}
		if u.VendorID != nil {
			return *u.VendorID, u, true
		}
		return 0, u, true
	}
	if u.VendorID == nil {
		return 0, u, true
	}
	return *u.VendorID, u, true
}

func (s *Server) requireVendorWrite(c *gin.Context) (*dbUser, bool) {
	p := principal(c)
	u, err := s.loadUser(c.Request.Context(), p.UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return nil, false
	}
	if u.VendorID == nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "User must be assigned to a vendor company")
		return nil, false
	}
	return u, true
}

func (s *Server) listAssessments(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"assessments": []any{}, "total": 0})
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM assessment_results WHERE vendor_id = $1`, vendorID).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, overall_percentage, maturity_level, assessment_count, completed_at, pillar_results
		FROM assessment_results
		WHERE vendor_id = $1
		ORDER BY completed_at DESC NULLS LAST
		LIMIT $2 OFFSET $3
	`, vendorID, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id int
		var pct float32
		var level string
		var count *int
		var completed any
		var pillar []byte
		if rows.Scan(&id, &pct, &level, &count, &completed, &pillar) != nil {
			continue
		}
		earned := 0
		var pillars map[string]struct {
			EarnedPoints float64 `json:"earnedPoints"`
		}
		if json.Unmarshal(pillar, &pillars) == nil {
			for _, p := range pillars {
				earned += int(p.EarnedPoints)
			}
		}
		list = append(list, gin.H{
			"id": id, "overallPercentage": pct, "maturityLevel": level,
			"assessmentCount": count, "completedAt": completed,
			"totalEarnedPoints": earned,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"assessments": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) latestAssessment(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"assessment": nil})
		return
	}
	var (
		id, userID                              int
		pct                                     float32
		level                                   string
		pillar, answers, recActions, recModules []byte
		count                                   *int
		completed                               any
	)
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT id, COALESCE(user_id,0), overall_percentage, maturity_level,
			pillar_results, answers, recommended_actions, recommended_modules,
			assessment_count, completed_at
		FROM assessment_results
		WHERE vendor_id = $1
		ORDER BY completed_at DESC NULLS LAST
		LIMIT 1
	`, vendorID).Scan(&id, &userID, &pct, &level, &pillar, &answers, &recActions, &recModules, &count, &completed)
	if err != nil {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"assessment": nil})
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"assessment": gin.H{
		"id": id, "userId": userID, "overallPercentage": pct, "maturityLevel": level,
		"pillarResults": json.RawMessage(pillar), "answers": json.RawMessage(answers),
		"recommendedActions": json.RawMessage(recActions), "recommendedModules": json.RawMessage(recModules),
		"assessmentCount": count, "completedAt": completed,
	}})
}

func (s *Server) loadScoreQuestions(c *gin.Context) ([]scoreQ, bool) {
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT id, pillar, COALESCE(recommended_action,'null'), COALESCE(recommended_module,'null')
		FROM assessment_questions WHERE is_active = true ORDER BY question_number
	`)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return nil, false
	}
	defer rows.Close()
	qs := make([]scoreQ, 0, 16)
	for rows.Next() {
		var q scoreQ
		if rows.Scan(&q.ID, &q.Pillar, &q.RecAction, &q.RecModule) != nil {
			continue
		}
		qs = append(qs, q)
	}
	return qs, true
}

func (s *Server) assessmentDone(ctx context.Context, vendorID int) bool {
	var n int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM assessment_results WHERE vendor_id = $1`, vendorID).Scan(&n)
	return n > 0
}

func (s *Server) getAssessmentDraft(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var raw []byte
	err := s.db.QueryRow(c.Request.Context(), `SELECT COALESCE(assessment_answers, '{}'::jsonb) FROM vendors WHERE id = $1`, *user.VendorID).Scan(&raw)
	if err != nil {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"answers": map[string]string{}})
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"answers": json.RawMessage(raw)})
}

func (s *Server) saveAssessmentDraft(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	if s.assessmentDone(c.Request.Context(), *user.VendorID) {
		httpx.Error(c.Writer, http.StatusConflict, "already_scored")
		return
	}
	var body struct {
		Answers map[string]string `json:"answers"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Answers == nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if len(body.Answers) > 40 {
		httpx.Error(c.Writer, http.StatusBadRequest, "too many answers")
		return
	}
	allowedAns := map[string]struct{}{"yes": {}, "partially": {}, "not_yet": {}, "na": {}}
	for k, v := range body.Answers {
		if k == "" || len(k) > 40 {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid answer key")
			return
		}
		if _, ok := allowedAns[v]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid answer")
			return
		}
	}
	b, err := json.Marshal(body.Answers)
	if err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid answers")
		return
	}
	_, err = s.db.Exec(c.Request.Context(), `UPDATE vendors SET assessment_answers = $2::jsonb, updated_at = now() WHERE id = $1`, *user.VendorID, b)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "save failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"ok": true})
}

func (s *Server) createAssessment(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	if s.assessmentDone(c.Request.Context(), *user.VendorID) {
		httpx.Error(c.Writer, http.StatusConflict, "already_scored")
		return
	}
	var body struct {
		Answers map[string]string `json:"answers"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if body.Answers == nil {
		body.Answers = map[string]string{}
	}
	if len(body.Answers) > 40 {
		httpx.Error(c.Writer, http.StatusBadRequest, "too many answers")
		return
	}
	allowedAns := map[string]struct{}{"yes": {}, "partially": {}, "not_yet": {}, "na": {}}
	for k, v := range body.Answers {
		if k == "" || len(k) > 40 {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid answer key")
			return
		}
		if _, ok := allowedAns[v]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid answer")
			return
		}
	}
	qs, ok := s.loadScoreQuestions(c)
	if !ok {
		return
	}
	scored := scoreAssessment(qs, body.Answers)
	answersJSON, err := json.Marshal(body.Answers)
	if err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid answers")
		return
	}

	ctx := c.Request.Context()
	var prev int
	_ = s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM assessment_results WHERE vendor_id = $1`, *user.VendorID).Scan(&prev)
	var prevSnap gin.H
	if prev > 0 {
		var pct float32
		var level string
		var earned int
		var completed any
		_ = s.db.QueryRow(ctx, `
			SELECT overall_percentage, maturity_level, completed_at,
				COALESCE((pillar_results->'E'->>'earnedPoints')::int,0)
				+ COALESCE((pillar_results->'S'->>'earnedPoints')::int,0)
				+ COALESCE((pillar_results->'G'->>'earnedPoints')::int,0)
			FROM assessment_results WHERE vendor_id = $1
			ORDER BY completed_at DESC NULLS LAST LIMIT 1
		`, *user.VendorID).Scan(&pct, &level, &completed, &earned)
		prevSnap = gin.H{
			"completedAt": completed, "overallPercentage": pct,
			"maturityLevel": level, "totalEarnedPoints": earned,
		}
	}

	var id int
	err = s.db.QueryRow(ctx, `
		INSERT INTO assessment_results (
			vendor_id, user_id, overall_percentage, maturity_level,
			pillar_results, answers, recommended_actions, recommended_modules,
			assessment_count
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id
	`, *user.VendorID, user.ID, scored.Overall, scored.Level,
		scored.Pillars, answersJSON, scored.RecActions, scored.RecModules,
		prev+1).Scan(&id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "insert failed")
		return
	}
	badge := "Starter"
	switch scored.Level {
	case "Contributor":
		badge = "Bronze"
	case "Practitioner":
		badge = "Silver"
	case "Leader":
		badge = "Gold"
	}
	_, _ = s.db.Exec(ctx, `
		UPDATE vendors SET esg_score = $2, esg_maturity_level = $3, updated_at = now() WHERE id = $1
	`, *user.VendorID, scored.Overall, badge)
	s.writeAudit(ctx, user.ID, "assessment_complete", "vendor", strconv.Itoa(*user.VendorID), nil, scored.Level)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"success": true,
		"assessment": gin.H{
			"id": id, "overallPercentage": scored.Overall, "maturityLevel": scored.Level,
			"totalEarnedPoints": scored.Earned, "totalMaxPoints": scored.Max,
			"pillarResults":      json.RawMessage(scored.Pillars),
			"answers":            json.RawMessage(answersJSON),
			"recommendedActions": json.RawMessage(scored.RecActions),
			"recommendedModules": json.RawMessage(scored.RecModules),
			"assessmentCount":    prev + 1,
			"previousResult":     prevSnap,
			"completedAt":        time.Now().UTC(),
		},
	})
}

func (s *Server) listActions(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"actions": []any{}, "total": 0})
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendor_actions WHERE vendor_id = $1`, vendorID).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, action_id, title, pillar, COALESCE(status,'Not Started'), evidence_file_name, points,
			submitted_at, verified_at, COALESCE(notes,''), COALESCE(quantity_reported,1),
			verification_feedback, verified_by, created_at, ai_verification_score,
			COALESCE((
				SELECT json_agg(json_build_object(
					'id', ef.id::text,
					'fileName', ef.file_name,
					'fileUrl', '/api/evidence/' || ef.id,
					'fileType', ef.file_type,
					'uploadedAt', ef.uploaded_at
				) ORDER BY ef.id)
				FROM evidence_files ef WHERE ef.vendor_action_id = vendor_actions.id
			), '[]'::json)
		FROM vendor_actions WHERE vendor_id = $1
		ORDER BY id DESC LIMIT $2 OFFSET $3
	`, vendorID, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, points int
		var actionID, title, pillar, status, notes string
		var evName, feedback, verifiedBy *string
		var qty float32
		var aiScore *float32
		var submitted, verified, created any
		var files []byte
		if rows.Scan(&id, &actionID, &title, &pillar, &status, &evName, &points, &submitted, &verified,
			&notes, &qty, &feedback, &verifiedBy, &created, &aiScore, &files) != nil {
			continue
		}
		item := gin.H{
			"id": strconv.Itoa(id), "vendorId": strconv.Itoa(vendorID), "actionId": actionID,
			"title": title, "pillar": pillar, "status": status, "evidenceFileName": evName,
			"points": points, "submittedAt": submitted, "verifiedAt": verified,
			"notes": notes, "quantityReported": qty, "verificationFeedback": deref(feedback),
			"verifiedBy": deref(verifiedBy), "committedDate": created, "evidenceFiles": jsonRaw(files),
		}
		if aiScore != nil {
			item["aiVerificationScore"] = *aiScore
		}
		list = append(list, item)
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"actions": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) upsertAction(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		ActionID         string `json:"actionId"`
		Title            string `json:"title"`
		Pillar           string `json:"pillar"`
		Status           string `json:"status"`
		EvidenceFileURL  string `json:"evidenceFileUrl"`
		EvidenceFileName string `json:"evidenceFileName"`
		Points           *int   `json:"points"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ActionID = strings.TrimSpace(body.ActionID)
	body.Title = strings.TrimSpace(body.Title)
	if body.ActionID == "" || len(body.ActionID) > 80 || body.Title == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "actionId and title required")
		return
	}
	if _, ok := allowedPillar[body.Pillar]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
		return
	}
	if body.Status == "" {
		body.Status = "Not Started"
	}
	if _, ok := allowedActionStatus[body.Status]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
		return
	}
	points := 0
	if body.Points != nil {
		if *body.Points < 0 || *body.Points > 10000 {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid points")
			return
		}
		points = *body.Points
	}
	evURL, okURL := httpx.HTTPSURL(body.EvidenceFileURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "evidenceFileUrl must be https")
		return
	}
	body.EvidenceFileURL = evURL
	body.EvidenceFileName = strings.TrimSpace(body.EvidenceFileName)
	if len(body.EvidenceFileName) > 200 {
		body.EvidenceFileName = body.EvidenceFileName[:200]
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO vendor_actions (vendor_id, action_id, title, pillar, status, evidence_file_url, evidence_file_name, points, submitted_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $5 = 'Submitted' THEN now() ELSE NULL END)
		ON CONFLICT (vendor_id, action_id) DO UPDATE SET
			title = EXCLUDED.title,
			status = EXCLUDED.status,
			evidence_file_url = COALESCE(EXCLUDED.evidence_file_url, vendor_actions.evidence_file_url),
			evidence_file_name = COALESCE(EXCLUDED.evidence_file_name, vendor_actions.evidence_file_name),
			points = COALESCE(EXCLUDED.points, vendor_actions.points),
			submitted_at = CASE WHEN EXCLUDED.status = 'Submitted' THEN now() ELSE vendor_actions.submitted_at END
	`, *user.VendorID, body.ActionID, body.Title, body.Pillar, body.Status,
		nullIfEmpty(body.EvidenceFileURL), nullIfEmpty(body.EvidenceFileName), points)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func (s *Server) listImpacts(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"impacts": []any{}, "total": 0})
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM impact_records WHERE vendor_id = $1`, vendorID).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, metric_key, value, unit, period, created_at
		FROM impact_records WHERE vendor_id = $1
		ORDER BY created_at DESC LIMIT $2 OFFSET $3
	`, vendorID, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id int
		var key, unit, period string
		var value float32
		var created any
		if rows.Scan(&id, &key, &value, &unit, &period, &created) != nil {
			continue
		}
		list = append(list, gin.H{"id": id, "metricKey": key, "value": value, "unit": unit, "period": period, "createdAt": created})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"impacts": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) createImpact(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		MetricKey string  `json:"metricKey"`
		Value     float64 `json:"value"`
		Unit      string  `json:"unit"`
		Period    string  `json:"period"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.MetricKey = strings.TrimSpace(body.MetricKey)
	body.Unit = strings.TrimSpace(body.Unit)
	body.Period = strings.TrimSpace(body.Period)
	if body.Period == "" {
		body.Period = "2026"
	}
	if body.MetricKey == "" || len(body.MetricKey) > 64 || len(body.Unit) > 32 || len(body.Period) > 32 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid metric fields")
		return
	}
	if body.Value < 0 || body.Value > 1e12 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid value")
		return
	}
	var id int
	err := s.db.QueryRow(c.Request.Context(), `
		INSERT INTO impact_records (vendor_id, metric_key, value, unit, period)
		VALUES ($1,$2,$3,$4,$5) RETURNING id
	`, *user.VendorID, body.MetricKey, body.Value, body.Unit, body.Period).Scan(&id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "insert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "impact": gin.H{"id": id}})
}

func (s *Server) listLearning(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"learning": []any{}, "total": 0})
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM learning_progress WHERE vendor_id = $1`, vendorID).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, module_id, completed, quiz_score, completed_at
		FROM learning_progress WHERE vendor_id = $1
		ORDER BY id DESC LIMIT $2 OFFSET $3
	`, vendorID, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id int
		var moduleID string
		var completed *bool
		var score *int
		var completedAt any
		if rows.Scan(&id, &moduleID, &completed, &score, &completedAt) != nil {
			continue
		}
		list = append(list, gin.H{"id": id, "moduleId": moduleID, "completed": completed, "quizScore": score, "completedAt": completedAt})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"learning": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) upsertLearning(c *gin.Context) {
	user, ok := s.requireVendorWrite(c)
	if !ok {
		return
	}
	var body struct {
		ModuleID  string `json:"moduleId"`
		Completed bool   `json:"completed"`
		QuizScore *int   `json:"quizScore"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ModuleID = strings.TrimSpace(body.ModuleID)
	if body.ModuleID == "" || len(body.ModuleID) > 80 {
		httpx.Error(c.Writer, http.StatusBadRequest, "moduleId required")
		return
	}
	if body.QuizScore != nil && (*body.QuizScore < 0 || *body.QuizScore > 100) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid quizScore")
		return
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO learning_progress (vendor_id, user_id, module_id, completed, quiz_score, completed_at)
		VALUES ($1,$2,$3,$4,$5, CASE WHEN $4 THEN now() ELSE NULL END)
		ON CONFLICT (vendor_id, module_id) DO UPDATE SET
			completed = EXCLUDED.completed,
			quiz_score = COALESCE(EXCLUDED.quiz_score, learning_progress.quiz_score),
			completed_at = CASE WHEN EXCLUDED.completed THEN now() ELSE learning_progress.completed_at END
	`, *user.VendorID, user.ID, body.ModuleID, body.Completed, body.QuizScore)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func nullIfEmpty(s string) any {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return s
}
