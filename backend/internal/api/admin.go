package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"esg-together/backend/internal/httpx"
)

var allowedVerify = map[string]struct{}{"Pending": {}, "Verified": {}, "Needs Review": {}}
var allowedRoles = map[string]struct{}{
	roleSuperAdmin: {}, roleAdmin: {}, roleVendorAdmin: {}, roleVendorMember: {}, roleVendorLegacy: {},
}

func (s *Server) requireSuper(c *gin.Context) (*dbUser, bool) {
	p := principal(c)
	user, err := s.loadUser(c.Request.Context(), p.UID)
	if err != nil || user.Role != roleSuperAdmin {
		httpx.Error(c.Writer, http.StatusForbidden, "Forbidden: Super Admin access required")
		return nil, false
	}
	return user, true
}

func (s *Server) requireAdmin(c *gin.Context) (*dbUser, bool) {
	p := principal(c)
	user, err := s.loadUser(c.Request.Context(), p.UID)
	if err != nil || !isAdmin(user.Role) {
		httpx.Error(c.Writer, http.StatusForbidden, "Forbidden: Admin access required")
		return nil, false
	}
	return user, true
}

func (s *Server) corporateGrid(c *gin.Context) {
	if _, ok := s.requireAdmin(c); !ok {
		return
	}
	ctx := c.Request.Context()
	page := httpx.ParsePage(c.Request)
	q := strings.TrimSpace(c.Query("q"))
	status := strings.TrimSpace(c.Query("status"))
	if status == "All" {
		status = ""
	}

	args := []any{}
	where := []string{"TRUE"}
	if q != "" {
		args = append(args, likeContains(q))
		where = append(where, `(v.company_name ILIKE `+httpx.P(len(args))+` ESCAPE '\'
			OR v.industry ILIKE `+httpx.P(len(args))+` ESCAPE '\'
			OR COALESCE(v.contact_person,'') ILIKE `+httpx.P(len(args))+` ESCAPE '\')`)
	}
	if status != "" {
		if _, ok := allowedVerify[status]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
			return
		}
		args = append(args, status)
		where = append(where, `v.verification_status = `+httpx.P(len(args)))
	}
	whereSQL := strings.Join(where, " AND ")

	var total int
	countQ := `SELECT COUNT(*) FROM vendors v WHERE ` + whereSQL
	if err := s.db.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "count failed")
		return
	}

	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT v.id, v.company_name, v.industry, v.employee_count, v.contact_person, v.phone, v.address, v.verification_status,
			a.overall_percentage, a.maturity_level, a.completed_at, a.pillar_results,
			COALESCE(ac.assessment_count, 0),
			COALESCE(act.actions_count, 0),
			COALESCE(act.completed_count, 0)
		FROM vendors v
		LEFT JOIN LATERAL (
			SELECT overall_percentage, maturity_level, completed_at, pillar_results
			FROM assessment_results
			WHERE vendor_id = v.id
			ORDER BY completed_at DESC NULLS LAST
			LIMIT 1
		) a ON TRUE
		LEFT JOIN (
			SELECT vendor_id, COUNT(*)::int AS assessment_count
			FROM assessment_results GROUP BY vendor_id
		) ac ON ac.vendor_id = v.id
		LEFT JOIN (
			SELECT vendor_id,
				COUNT(*)::int AS actions_count,
				COUNT(*) FILTER (WHERE status IN ('Verified','Submitted'))::int AS completed_count
			FROM vendor_actions GROUP BY vendor_id
		) act ON act.vendor_id = v.id
		WHERE `+whereSQL+`
		ORDER BY v.company_name
		LIMIT `+httpx.P(len(args)-1)+` OFFSET `+httpx.P(len(args)), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()

	type row struct {
		id                                          int
		company, industry, employees                string
		contact, phone, address, vstatus            *string
		pct                                         *float32
		level                                       *string
		completed                                   any
		pillars                                     []byte
		assessmentCount, actionsCount, completedCnt int
	}
	list := make([]gin.H, 0, page.Limit)
	ids := make([]int, 0, page.Limit)
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.company, &r.industry, &r.employees, &r.contact, &r.phone, &r.address, &r.vstatus,
			&r.pct, &r.level, &r.completed, &r.pillars, &r.assessmentCount, &r.actionsCount, &r.completedCnt); err != nil {
			continue
		}
		var latest any
		if r.level != nil {
			latest = gin.H{"overallPercentage": r.pct, "maturityLevel": r.level, "completedAt": r.completed, "pillarResults": jsonObj(r.pillars)}
		}
		list = append(list, gin.H{
			"id": r.id, "companyName": r.company, "industry": r.industry, "employeeCount": r.employees,
			"contactPerson": r.contact, "phone": r.phone, "address": r.address,
			"verificationStatus": r.vstatus, "allowedEmails": []string{},
			"latestAssessment": latest, "assessmentCount": r.assessmentCount,
			"actionsCount": r.actionsCount, "completedActionsCount": r.completedCnt,
		})
		ids = append(ids, r.id)
	}

	if len(ids) > 0 {
		erows, err := s.db.Query(ctx, `
			SELECT vendor_id, email FROM vendor_allowed_emails
			WHERE vendor_id = ANY($1)
			ORDER BY email
		`, ids)
		if err == nil {
			emails := map[int][]string{}
			for erows.Next() {
				var vid int
				var em string
				if erows.Scan(&vid, &em) == nil {
					emails[vid] = append(emails[vid], em)
				}
			}
			erows.Close()
			for i, item := range list {
				id := item["id"].(int)
				if ems, ok := emails[id]; ok {
					list[i]["allowedEmails"] = ems
				}
			}
		}
	}

	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"vendors": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) adminVendors(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	ctx := c.Request.Context()
	page := httpx.ParsePage(c.Request)

	var totalVendors, totalUsers int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendors`).Scan(&totalVendors)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&totalUsers)

	vrows, err := s.db.Query(ctx, `
		SELECT `+vendorSelect+`
		FROM vendors ORDER BY company_name LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	vendors := scanVendors(vrows)
	vrows.Close()

	urows, err := s.db.Query(ctx, `
		SELECT id, uid, email, COALESCE(name,''), COALESCE(role,'vendor_member'), vendor_id
		FROM users ORDER BY id LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer urows.Close()
	users := make([]gin.H, 0, page.Limit)
	for urows.Next() {
		var u dbUser
		if urows.Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID) == nil {
			users = append(users, gin.H{
				"id": u.ID, "uid": u.UID, "email": u.Email, "name": u.Name, "role": u.Role, "vendorId": u.VendorID,
			})
		}
	}

	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"vendors": vendors, "users": users,
		"totalVendors": totalVendors, "totalUsers": totalUsers,
		"limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) excelUpload(c *gin.Context) {
	actor, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		Rows []map[string]any `json:"rows"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Rows == nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "Invalid rows data")
		return
	}
	if len(body.Rows) > 500 {
		httpx.Error(c.Writer, http.StatusBadRequest, "max 500 rows")
		return
	}

	ctx := c.Request.Context()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer tx.Rollback(ctx)

	created, updated, skipped := 0, 0, 0
	emailConflicts, emailsInvalid, rowsWithoutEmails := 0, 0, 0
	type invite struct {
		vendorID int
		email    string
	}
	invites := make([]invite, 0, len(body.Rows))
	for _, r := range body.Rows {
		company := pick(r, "companyName", "Company", "company", "company_name")
		if company == "" || len(company) > 200 {
			skipped++
			continue
		}
		industry := pick(r, "industry", "Industry")
		if industry == "" {
			industry = "Unspecified"
		}
		employees := pick(r, "employeeCount", "Employees", "employee_count")
		if employees == "" {
			employees = "TBD"
		}
		contact := pick(r, "contactPerson", "Contact", "contact")
		phone := pick(r, "phone", "Phone")
		address := pick(r, "address", "Address")
		emailsRaw := pick(r, "allowedEmails", "Emails", "Email", "emails", "allowed_emails")

		var vendorID int
		err := tx.QueryRow(ctx, `SELECT id FROM vendors WHERE lower(company_name) = lower($1)`, company).Scan(&vendorID)
		if err == nil {
			_, _ = tx.Exec(ctx, `
				UPDATE vendors SET industry=$2, employee_count=$3,
					contact_person=COALESCE(NULLIF($4,''), contact_person),
					phone=COALESCE(NULLIF($5,''), phone),
					address=COALESCE(NULLIF($6,''), address),
					updated_at=now()
				WHERE id=$1
			`, vendorID, industry, employees, contact, phone, address)
			updated++
		} else if err == pgx.ErrNoRows {
			err = tx.QueryRow(ctx, `
				INSERT INTO vendors (company_name, industry, employee_count, contact_person, phone, address, verification_status)
				VALUES ($1,$2,$3,$4,$5,$6,'Pending') RETURNING id
			`, company, industry, employees, contact, phone, address).Scan(&vendorID)
			if err != nil {
				skipped++
				continue
			}
			created++
		} else {
			httpx.Error(c.Writer, http.StatusInternalServerError, "vendor upsert failed")
			return
		}

		n := 0
		for _, em := range strings.FieldsFunc(emailsRaw, func(r rune) bool {
			return r == ',' || r == ';' || r == ' ' || r == '\n' || r == '\t'
		}) {
			em = strings.ToLower(strings.TrimSpace(em))
			if !httpx.ValidEmail(em) {
				if em != "" {
					emailsInvalid++
				}
				continue
			}
			n++
			if n > 20 {
				emailsInvalid++
				continue
			}
			tag, err := tx.Exec(ctx, `
				INSERT INTO vendor_allowed_emails (vendor_id, email)
				SELECT $1, $2
				WHERE NOT EXISTS (
					SELECT 1 FROM vendor_allowed_emails WHERE lower(email) = $2
				)
			`, vendorID, em)
			if err != nil {
				emailConflicts++
				continue
			}
			if tag.RowsAffected() > 0 {
				invites = append(invites, invite{vendorID: vendorID, email: em})
				continue
			}
			var owner int
			if tx.QueryRow(ctx, `SELECT vendor_id FROM vendor_allowed_emails WHERE lower(email) = $1`, em).Scan(&owner) == nil && owner != vendorID {
				emailConflicts++
			}
		}
		if n == 0 {
			rowsWithoutEmails++
		}
	}
	for _, inv := range invites {
		_, _ = tx.Exec(ctx, `
			INSERT INTO email_outbox (to_email, subject, body, kind, vendor_id)
			VALUES ($1, $2, $3, 'vendor_invite', $4)
		`, inv.email,
			"Undangan Portal ESG Siloam",
			"Anda diundang ke Portal ESG Together (Siloam). Daftar dan masuk memakai email ini: "+inv.email,
			inv.vendorID)
	}
	if err := tx.Commit(ctx); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	s.writeAudit(ctx, actor.ID, "excel_import", "vendors", "bulk", nil, gin.H{
		"createdCount": created, "updatedCount": updated, "invitesQueued": len(invites),
		"skippedCount": skipped, "emailConflicts": emailConflicts, "emailsInvalid": emailsInvalid,
		"rowsWithoutEmails": rowsWithoutEmails,
	})
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"success": true, "createdCount": created, "updatedCount": updated, "invitesQueued": len(invites),
		"skippedCount": skipped, "emailConflicts": emailConflicts, "emailsInvalid": emailsInvalid,
		"rowsWithoutEmails": rowsWithoutEmails,
	})
}

func (s *Server) verifyVendor(c *gin.Context) {
	actor, ok := s.requireSuper(c)
	if !ok {
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		VerificationStatus string `json:"verificationStatus"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if _, ok := allowedVerify[body.VerificationStatus]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid verificationStatus")
		return
	}
	tag, err := s.db.Exec(c.Request.Context(), `
		UPDATE vendors SET verification_status = $2, updated_at = now() WHERE id = $1
	`, id, body.VerificationStatus)
	if err != nil || tag.RowsAffected() == 0 {
		httpx.Error(c.Writer, http.StatusNotFound, "vendor not found")
		return
	}
	v, _ := s.getVendorByID(c.Request.Context(), id)
	s.writeAudit(c.Request.Context(), actor.ID, "vendor_verify", "vendor", strconv.Itoa(id), nil, body.VerificationStatus)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "vendor": v})
}

func (s *Server) updateUserRole(c *gin.Context) {
	actor, ok := s.requireSuper(c)
	if !ok {
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	if id == actor.ID {
		httpx.Error(c.Writer, http.StatusBadRequest, "cannot change own role")
		return
	}
	var body struct {
		Role     string `json:"role"`
		VendorID *int   `json:"vendorId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	if body.Role == roleVendorLegacy {
		body.Role = roleVendorMember
	}
	if _, ok := allowedRoles[body.Role]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid role")
		return
	}
	_, err = s.db.Exec(c.Request.Context(), `
		UPDATE users SET role = $2, vendor_id = $3 WHERE id = $1
	`, id, body.Role, body.VendorID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	s.writeAudit(c.Request.Context(), actor.ID, "role_change", "user", strconv.Itoa(id), nil, gin.H{"role": body.Role, "vendorId": body.VendorID})
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func pickKey(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "_", "")
	return s
}

func pick(row map[string]any, keys ...string) string {
	byKey := make(map[string]any, len(row))
	for k, v := range row {
		byKey[pickKey(k)] = v
	}
	for _, k := range keys {
		if v, ok := byKey[pickKey(k)]; ok && v != nil {
			s := strings.TrimSpace(asString(v))
			if s != "" {
				return s
			}
		}
	}
	return ""
}

func asString(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case json.Number:
		return t.String()
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return ""
		}
		return strings.Trim(string(b), `"`)
	}
}
