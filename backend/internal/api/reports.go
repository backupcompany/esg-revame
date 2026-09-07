package api

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func csvSafe(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	if s == "" {
		return s
	}
	switch s[0] {
	case '=', '+', '-', '@':
		return "'" + s
	}
	return s
}

func (s *Server) exportCommitmentsCSV(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.Error(c.Writer, http.StatusBadRequest, "vendor required")
		return
	}
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT va.id, va.action_id, va.title, va.pillar, COALESCE(va.status,''),
			COALESCE(va.quantity_reported,1), COALESCE(va.points,0), va.submitted_at, va.verified_at
		FROM vendor_actions va
		WHERE va.vendor_id = $1
		ORDER BY va.id DESC
		LIMIT 500
	`, vendorID)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="esg-commitments.csv"`)
	w := csv.NewWriter(c.Writer)
	_ = w.Write([]string{"id", "actionId", "title", "pillar", "status", "quantity", "points", "submittedAt", "verifiedAt"})
	for rows.Next() {
		var id, points int
		var actionID, title, pillar, status string
		var qty float64
		var submitted, verified any
		if rows.Scan(&id, &actionID, &title, &pillar, &status, &qty, &points, &submitted, &verified) != nil {
			continue
		}
		_ = w.Write([]string{
			strconv.Itoa(id), csvSafe(actionID), csvSafe(title), pillar, csvSafe(status),
			strconv.FormatFloat(qty, 'f', 2, 64), strconv.Itoa(points), fmtAny(submitted), fmtAny(verified),
		})
	}
	w.Flush()
}

func (s *Server) exportVendorsCSV(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT v.id, v.company_name, v.industry, v.employee_count,
			COALESCE(v.contact_person,''), COALESCE(v.phone,''), COALESCE(v.address,''),
			COALESCE(v.verification_status,''), v.esg_score, v.esg_maturity_level, v.onboarding_completed,
			COALESCE((SELECT string_agg(e.email, ',' ORDER BY e.email) FROM vendor_allowed_emails e WHERE e.vendor_id = v.id), '')
		FROM vendors v ORDER BY v.company_name LIMIT 500
	`)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="esg-vendors.csv"`)
	w := csv.NewWriter(c.Writer)
	_ = w.Write([]string{"companyName", "industry", "employeeCount", "contactPerson", "phone", "address", "allowedEmails", "verificationStatus", "esgScore", "maturity", "onboardingCompleted"})
	for rows.Next() {
		var id int
		var company, industry, employees, contact, phone, address, status, maturity, emails string
		var score float64
		var onboard bool
		if rows.Scan(&id, &company, &industry, &employees, &contact, &phone, &address, &status, &score, &maturity, &onboard, &emails) != nil {
			continue
		}
		_ = w.Write([]string{
			csvSafe(company), csvSafe(industry), csvSafe(employees), csvSafe(contact), csvSafe(phone), csvSafe(address),
			csvSafe(emails), csvSafe(status), strconv.FormatFloat(score, 'f', 1, 64), maturity, strconv.FormatBool(onboard),
		})
	}
	w.Flush()
}

func (s *Server) listAILogs(c *gin.Context) {
	vendorID, user, ok := s.vendorScope(c)
	if !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	where := "user_id = $1"
	args := []any{user.ID}
	n := 2
	if isAdmin(user.Role) && vendorID > 0 {
		where = "vendor_id = $1"
		args = []any{vendorID}
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM ai_logs WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT id, COALESCE(model,''), COALESCE(action_type,''), COALESCE(tokens_used,0), created_at
		FROM ai_logs WHERE `+where+`
		ORDER BY created_at DESC
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, tokens int
		var model, action string
		var at any
		if rows.Scan(&id, &model, &action, &tokens, &at) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": strconv.Itoa(id), "model": model, "actionType": action,
			"tokensUsed": tokens, "timestamp": at, "estimatedCost": 0,
			"userSession": "",
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"logs": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) adminOutbox(c *gin.Context) {
	if _, ok := s.requireAdmin(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM email_outbox`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, to_email, subject, kind, status, created_at
		FROM email_outbox ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id int
		var to, subj, kind, status string
		var at any
		if rows.Scan(&id, &to, &subj, &kind, &status, &at) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "toEmail": to, "subject": subj, "kind": kind, "status": status, "createdAt": at,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"items": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func fmtAny(v any) string {
	if v == nil {
		return ""
	}
	switch t := v.(type) {
	case time.Time:
		return t.UTC().Format(time.RFC3339)
	default:
		return csvSafe(fmt.Sprint(t))
	}
}
