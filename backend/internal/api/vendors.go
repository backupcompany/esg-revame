package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"esg-together/backend/internal/httpx"
)

const vendorSelect = `
	id, company_name, industry, employee_count, contact_person, phone, address, verification_status, created_at,
	esg_score, esg_maturity_level, onboarding_completed,
	company_size, contact_email, esg_familiarity, esg_objectives, onboarding_completed_at
`

var allowedFamiliarity = map[string]string{
	"getting_started":     "Starter",
	"several_activities":  "Bronze",
	"structured_programs": "Silver",
	"publish_reports":     "Gold",
}

func (s *Server) getVendors(c *gin.Context) {
	p := principal(c)
	ctx := c.Request.Context()
	user, err := s.loadUser(ctx, p.UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}

	page := httpx.ParsePage(c.Request)

	if isAdmin(user.Role) {
		var total int
		_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendors`).Scan(&total)
		rows, err := s.db.Query(ctx, `
			SELECT `+vendorSelect+`
			FROM vendors
			ORDER BY company_name
			LIMIT $1 OFFSET $2
		`, page.Limit, page.Offset)
		if err != nil {
			httpx.QueryFailed(c.Writer)
			return
		}
		defer rows.Close()
		list := scanVendors(rows)
		var own any
		if user.VendorID != nil {
			if v, err := s.getVendorByID(ctx, *user.VendorID); err == nil {
				own = v
			}
		}
		httpx.JSON(c.Writer, http.StatusOK, gin.H{
			"vendors": list, "vendor": own, "total": total, "limit": page.Limit, "offset": page.Offset,
		})
		return
	}

	if user.VendorID == nil {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"vendor": nil, "vendors": []any{}, "total": 0})
		return
	}
	v, err := s.getVendorByID(ctx, *user.VendorID)
	if err != nil {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"vendor": nil, "vendors": []any{}})
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"vendor": v, "vendors": []any{v}, "total": 1})
}

func (s *Server) upsertVendor(c *gin.Context) {
	p := principal(c)
	ctx := c.Request.Context()
	user, err := s.loadUser(ctx, p.UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}

	var body struct {
		CompanyName         string   `json:"companyName"`
		Industry            string   `json:"industry"`
		EmployeeCount       string   `json:"employeeCount"`
		ContactPerson       string   `json:"contactPerson"`
		Phone               string   `json:"phone"`
		Address             string   `json:"address"`
		CompanySize         string   `json:"companySize"`
		ContactEmail        string   `json:"contactEmail"`
		EsgFamiliarity      string   `json:"esgFamiliarity"`
		EsgObjectives       []string `json:"esgObjectives"`
		OnboardingCompleted *bool    `json:"onboardingCompleted"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.CompanyName = strings.TrimSpace(body.CompanyName)
	if body.CompanyName == "" || len(body.CompanyName) > 200 {
		httpx.Error(c.Writer, http.StatusBadRequest, "companyName required")
		return
	}
	fam := strings.TrimSpace(body.EsgFamiliarity)
	if fam != "" {
		if _, ok := allowedFamiliarity[fam]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid esgFamiliarity")
			return
		}
	}
	var objJSON []byte
	if body.EsgObjectives != nil {
		var err error
		objJSON, err = json.Marshal(body.EsgObjectives)
		if err != nil {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid esgObjectives")
			return
		}
	}
	initBadge := allowedFamiliarity[fam]

	if user.VendorID != nil {
		_, err = s.db.Exec(ctx, `
			UPDATE vendors SET
				company_name = $2, industry = $3, employee_count = $4,
				contact_person = $5, phone = $6, address = $7,
				company_size = COALESCE(NULLIF($8,''), company_size),
				contact_email = COALESCE(NULLIF($9,''), contact_email),
				esg_familiarity = COALESCE(NULLIF($10,''), esg_familiarity),
				esg_objectives = COALESCE($11::jsonb, esg_objectives),
				onboarding_completed = COALESCE($12, onboarding_completed),
				onboarding_completed_at = CASE
					WHEN $12 = true THEN COALESCE(onboarding_completed_at, now())
					ELSE onboarding_completed_at
				END,
				esg_maturity_level = CASE
					WHEN $12 = true AND esg_score = 0 AND NULLIF($13,'') IS NOT NULL THEN $13
					ELSE esg_maturity_level
				END,
				updated_at = now()
			WHERE id = $1
		`, *user.VendorID, body.CompanyName, strings.TrimSpace(body.Industry),
			strings.TrimSpace(body.EmployeeCount), strings.TrimSpace(body.ContactPerson),
			strings.TrimSpace(body.Phone), strings.TrimSpace(body.Address),
			strings.TrimSpace(body.CompanySize), strings.ToLower(strings.TrimSpace(body.ContactEmail)),
			nullIfEmpty(fam), objJSON, body.OnboardingCompleted, initBadge)
		if err != nil {
			httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
			return
		}
		v, _ := s.getVendorByID(ctx, *user.VendorID)
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "vendor": v})
		return
	}

	if !canCreateUnlinkedVendor(user.Role) {
		httpx.Error(c.Writer, http.StatusForbidden, "not linked to a vendor")
		return
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "tx failed")
		return
	}
	defer tx.Rollback(ctx)

	var vendorID int
	err = tx.QueryRow(ctx, `SELECT id FROM vendors WHERE company_name = $1`, body.CompanyName).Scan(&vendorID)
	if err != nil {
		err = tx.QueryRow(ctx, `
			INSERT INTO vendors (
				company_name, industry, employee_count, contact_person, phone, address, verification_status,
				company_size, contact_email, esg_familiarity, esg_objectives, esg_maturity_level
			)
			VALUES ($1,$2,$3,$4,$5,$6,'Pending',$7,$8,$9,COALESCE($10::jsonb,'[]'::jsonb),COALESCE(NULLIF($11,''),'Starter'))
			RETURNING id
		`, body.CompanyName, strings.TrimSpace(body.Industry), strings.TrimSpace(body.EmployeeCount),
			strings.TrimSpace(body.ContactPerson), strings.TrimSpace(body.Phone), strings.TrimSpace(body.Address),
			strings.TrimSpace(body.CompanySize), strings.ToLower(strings.TrimSpace(body.ContactEmail)),
			nullIfEmpty(fam), objJSON, initBadge).Scan(&vendorID)
		if err != nil {
			httpx.Error(c.Writer, http.StatusConflict, "could not create vendor")
			return
		}
	}
	role := roleVendorAdmin
	if user.Role == roleSuperAdmin {
		role = roleSuperAdmin
	}
	_, err = tx.Exec(ctx, `UPDATE users SET vendor_id = $2, role = $3 WHERE id = $1`, user.ID, vendorID, role)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "link failed")
		return
	}
	if err := tx.Commit(ctx); err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "commit failed")
		return
	}
	v, _ := s.getVendorByID(ctx, vendorID)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "vendor": v})
}

func (s *Server) getVendorByID(ctx context.Context, id int) (gin.H, error) {
	row := s.db.QueryRow(ctx, `SELECT `+vendorSelect+` FROM vendors WHERE id = $1`, id)
	item, err := scanVendorRow(row)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func scanVendors(rows pgx.Rows) []gin.H {
	out := make([]gin.H, 0, 16)
	for rows.Next() {
		item, err := scanVendorRow(rows)
		if err != nil {
			continue
		}
		out = append(out, item)
	}
	return out
}

type vendorScanner interface {
	Scan(dest ...any) error
}

func scanVendorRow(row vendorScanner) (gin.H, error) {
	var id int
	var company, industry, employees, maturity string
	var contact, phone, address, status, companySize, contactEmail, familiarity *string
	var created, onboardAt any
	var score float64
	var onboard bool
	var objectives []byte
	if err := row.Scan(&id, &company, &industry, &employees, &contact, &phone, &address, &status, &created,
		&score, &maturity, &onboard, &companySize, &contactEmail, &familiarity, &objectives, &onboardAt); err != nil {
		return nil, err
	}
	if len(objectives) == 0 {
		objectives = []byte("[]")
	}
	return gin.H{
		"id": id, "companyName": company, "industry": industry, "employeeCount": employees,
		"contactPerson": contact, "phone": phone, "address": address,
		"verificationStatus": status, "createdAt": created,
		"esgScore": score, "esgMaturityLevel": maturity, "onboardingCompleted": onboard,
		"companySize": companySize, "contactEmail": contactEmail, "esgFamiliarity": familiarity,
		"esgObjectives": json.RawMessage(objectives), "onboardingCompletedAt": onboardAt,
	}, nil
}
