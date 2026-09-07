package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"esg-together/backend/internal/httpx"
)

var allowedDifficulty = map[string]struct{}{"Starter": {}, "Moderate": {}, "Advanced": {}}
var allowedEvidenceType = map[string]struct{}{"photo": {}, "document": {}, "both": {}}

func catalogIDOK(id string) bool {
	if len(id) < 3 || len(id) > 80 {
		return false
	}
	for _, r := range id {
		if (r < 'a' || r > 'z') && (r < '0' || r > '9') && r != '_' {
			return false
		}
	}
	return true
}

func (s *Server) listCatalog(c *gin.Context) {
	if _, err := s.loadUser(c.Request.Context(), principal(c).UID); err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	page := httpx.ParsePage(c.Request)
	pillar := strings.TrimSpace(c.Query("pillar"))
	q := strings.TrimSpace(c.Query("q"))
	includeInactive := c.Query("includeInactive") == "1"
	user, _ := s.loadUser(c.Request.Context(), principal(c).UID)
	if user != nil && isAdmin(user.Role) && c.Query("includeInactive") == "" {
		includeInactive = true
	}

	where := []string{"1=1"}
	args := []any{}
	n := 1
	if !includeInactive {
		where = append(where, "is_active = true")
	}
	if pillar != "" && pillar != "ALL" {
		if _, ok := allowedPillar[pillar]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
			return
		}
		where = append(where, "pillar = "+httpx.P(n))
		args = append(args, pillar)
		n++
	}
	if q != "" {
		if len(q) > 80 {
			q = q[:80]
		}
		p := httpx.P(n)
		where = append(where, `(title ILIKE `+p+` ESCAPE '\' OR COALESCE(title_id,'') ILIKE `+p+` ESCAPE '\' OR id ILIKE `+p+` ESCAPE '\')`)
		args = append(args, likeContains(q))
		n++
	}
	clause := strings.Join(where, " AND ")
	countQ := `SELECT COUNT(*) FROM action_catalog WHERE ` + clause
	var total int
	if err := s.db.QueryRow(c.Request.Context(), countQ, args...).Scan(&total); err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	listQ := `
		SELECT id, title, title_id, description, description_id, pillar, category, category_id,
			difficulty, estimated_days, impact_metric_unit, impact_metric_unit_id,
			impact_metric_label, impact_metric_label_id, default_metric_name, impact_multiplier,
			icon_name, image_url, practical_tips, practical_tips_id, required_evidence_type,
			points, is_active, source, created_at, updated_at
		FROM action_catalog WHERE ` + clause + `
		ORDER BY pillar, title
		LIMIT ` + httpx.P(n) + ` OFFSET ` + httpx.P(n+1)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(c.Request.Context(), listQ, args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		item, ok := scanCatalogListRow(rows)
		if ok {
			list = append(list, item)
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"actions": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) getCatalogAction(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if !catalogIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	row := s.db.QueryRow(c.Request.Context(), `
		SELECT id, title, title_id, description, description_id, pillar, category, category_id,
			difficulty, estimated_days, impact_metric_unit, impact_metric_unit_id,
			impact_metric_label, impact_metric_label_id, default_metric_name, impact_multiplier,
			icon_name, image_url, practical_tips, practical_tips_id, required_evidence_type,
			points, is_active, source, created_at, updated_at
		FROM action_catalog WHERE id = $1
	`, id)
	item, err := scanCatalogFull(row)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "action not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"action": item})
}

func (s *Server) upsertCatalogAction(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	var body struct {
		ID                   string   `json:"id"`
		Title                string   `json:"title"`
		TitleID              string   `json:"titleId"`
		Description          string   `json:"description"`
		DescriptionID        string   `json:"descriptionId"`
		Pillar               string   `json:"pillar"`
		Category             string   `json:"category"`
		CategoryID           string   `json:"categoryId"`
		Difficulty           string   `json:"difficulty"`
		EstimatedDays        int      `json:"estimatedDays"`
		ImpactMetricUnit     string   `json:"impactMetricUnit"`
		ImpactMetricUnitID   string   `json:"impactMetricUnitId"`
		ImpactMetricLabel    string   `json:"impactMetricLabel"`
		ImpactMetricLabelID  string   `json:"impactMetricLabelId"`
		DefaultMetricName    string   `json:"defaultMetricName"`
		ImpactMultiplier     float64  `json:"impactMultiplier"`
		IconName             string   `json:"iconName"`
		ImageURL             string   `json:"imageUrl"`
		PracticalTips        []string `json:"practicalTips"`
		PracticalTipsID      []string `json:"practicalTipsId"`
		RequiredEvidenceType string   `json:"requiredEvidenceType"`
		Points               int      `json:"points"`
		IsActive             *bool    `json:"isActive"`
		Source               string   `json:"source"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.ToLower(strings.TrimSpace(body.ID))
	body.Title = strings.TrimSpace(body.Title)
	if !catalogIDOK(body.ID) || body.Title == "" || len(body.Title) > 200 {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
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
	if body.RequiredEvidenceType == "" {
		body.RequiredEvidenceType = "photo"
	}
	if _, ok := allowedEvidenceType[body.RequiredEvidenceType]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid requiredEvidenceType")
		return
	}
	if body.EstimatedDays < 1 || body.EstimatedDays > 365 {
		body.EstimatedDays = 7
	}
	if body.Points < 0 || body.Points > 10000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid points")
		return
	}
	if body.ImpactMultiplier < 0 || body.ImpactMultiplier > 1e9 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid impactMultiplier")
		return
	}
	if len(body.PracticalTips) > 20 {
		body.PracticalTips = body.PracticalTips[:20]
	}
	if len(body.PracticalTipsID) > 20 {
		body.PracticalTipsID = body.PracticalTipsID[:20]
	}
	tips, err := json.Marshal(body.PracticalTips)
	if err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid practicalTips")
		return
	}
	tipsID, err := json.Marshal(body.PracticalTipsID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid practicalTipsId")
		return
	}
	active := true
	if body.IsActive != nil {
		active = *body.IsActive
	}
	src := body.Source
	if src == "" {
		src = "system"
	}
	if body.DefaultMetricName == "" {
		body.DefaultMetricName = "energySavedKwh"
	}
	if len(body.DefaultMetricName) > 64 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid defaultMetricName")
		return
	}
	img, okURL := httpx.HTTPSURL(body.ImageURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "imageUrl must be https")
		return
	}
	body.ImageURL = img
	_, err = s.db.Exec(c.Request.Context(), `
		INSERT INTO action_catalog (
			id, title, title_id, description, description_id, pillar, category, category_id,
			difficulty, estimated_days, impact_metric_unit, impact_metric_unit_id,
			impact_metric_label, impact_metric_label_id, default_metric_name, impact_multiplier,
			icon_name, image_url, practical_tips, practical_tips_id, required_evidence_type,
			points, is_active, source, updated_at
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24, now()
		)
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, title_id=EXCLUDED.title_id, description=EXCLUDED.description,
			description_id=EXCLUDED.description_id, pillar=EXCLUDED.pillar, category=EXCLUDED.category,
			category_id=EXCLUDED.category_id, difficulty=EXCLUDED.difficulty, estimated_days=EXCLUDED.estimated_days,
			impact_metric_unit=EXCLUDED.impact_metric_unit, impact_metric_unit_id=EXCLUDED.impact_metric_unit_id,
			impact_metric_label=EXCLUDED.impact_metric_label, impact_metric_label_id=EXCLUDED.impact_metric_label_id,
			default_metric_name=EXCLUDED.default_metric_name, impact_multiplier=EXCLUDED.impact_multiplier,
			icon_name=EXCLUDED.icon_name, image_url=EXCLUDED.image_url, practical_tips=EXCLUDED.practical_tips,
			practical_tips_id=EXCLUDED.practical_tips_id, required_evidence_type=EXCLUDED.required_evidence_type,
			points=EXCLUDED.points, is_active=EXCLUDED.is_active, source=EXCLUDED.source, updated_at=now()
	`, body.ID, body.Title, nullIfEmpty(body.TitleID), body.Description, nullIfEmpty(body.DescriptionID),
		body.Pillar, nullIfEmpty(body.Category), nullIfEmpty(body.CategoryID), body.Difficulty, body.EstimatedDays,
		nullIfEmpty(body.ImpactMetricUnit), nullIfEmpty(body.ImpactMetricUnitID),
		nullIfEmpty(body.ImpactMetricLabel), nullIfEmpty(body.ImpactMetricLabelID),
		body.DefaultMetricName, body.ImpactMultiplier, nullIfEmpty(body.IconName), nullIfEmpty(body.ImageURL),
		tips, tipsID, body.RequiredEvidenceType, body.Points, active, src)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteCatalogAction(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !catalogIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	// Soft-delete: hide from vendors, keep history on vendor_actions.
	_, err := s.db.Exec(c.Request.Context(), `UPDATE action_catalog SET is_active=false, updated_at=now() WHERE id=$1`, id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func scanCatalogListRow(rows pgx.Rows) (gin.H, bool) {
	var (
		id, title, pillar                                                             string
		titleID, desc, descID, cat, catID, diff, unit, unitID, label, labelID, metric *string
		icon, image, evid, source                                                     *string
		days, points                                                                  int
		mult                                                                          float32
		active                                                                        bool
		tips, tipsID                                                                  []byte
		created, updated                                                              any
	)
	if rows.Scan(&id, &title, &titleID, &desc, &descID, &pillar, &cat, &catID, &diff, &days,
		&unit, &unitID, &label, &labelID, &metric, &mult, &icon, &image, &tips, &tipsID, &evid, &points, &active, &source, &created, &updated) != nil {
		return nil, false
	}
	return gin.H{
		"id": id, "title": title, "titleId": deref(titleID), "description": deref(desc), "descriptionId": deref(descID),
		"pillar": pillar, "category": deref(cat), "categoryId": deref(catID), "difficulty": deref(diff),
		"estimatedDays": days, "impactMetricUnit": deref(unit), "impactMetricUnitId": deref(unitID),
		"impactMetricLabel": deref(label), "impactMetricLabelId": deref(labelID),
		"defaultMetricName": deref(metric), "impactMultiplier": mult, "iconName": deref(icon), "imageUrl": deref(image),
		"practicalTips": json.RawMessage(nzJSON(tips)), "practicalTipsId": json.RawMessage(nzJSON(tipsID)),
		"requiredEvidenceType": deref(evid), "points": points, "isActive": active, "source": deref(source),
		"createdAt": created, "updatedAt": updated,
	}, true
}

func scanCatalogFull(row pgx.Row) (gin.H, error) {
	var (
		id, title, pillar                                                             string
		titleID, desc, descID, cat, catID, diff, unit, unitID, label, labelID, metric *string
		icon, image, evid, source                                                     *string
		days, points                                                                  int
		mult                                                                          float32
		active                                                                        bool
		tips, tipsID                                                                  []byte
		created, updated                                                              any
	)
	err := row.Scan(&id, &title, &titleID, &desc, &descID, &pillar, &cat, &catID, &diff, &days,
		&unit, &unitID, &label, &labelID, &metric, &mult, &icon, &image, &tips, &tipsID, &evid, &points, &active, &source, &created, &updated)
	if err != nil {
		return nil, err
	}
	return gin.H{
		"id": id, "title": title, "titleId": deref(titleID), "description": deref(desc), "descriptionId": deref(descID),
		"pillar": pillar, "category": deref(cat), "categoryId": deref(catID), "difficulty": deref(diff),
		"estimatedDays": days, "impactMetricUnit": deref(unit), "impactMetricUnitId": deref(unitID),
		"impactMetricLabel": deref(label), "impactMetricLabelId": deref(labelID),
		"defaultMetricName": deref(metric), "impactMultiplier": mult, "iconName": deref(icon), "imageUrl": deref(image),
		"practicalTips": json.RawMessage(nzJSON(tips)), "practicalTipsId": json.RawMessage(nzJSON(tipsID)),
		"requiredEvidenceType": deref(evid), "points": points, "isActive": active, "source": deref(source),
		"createdAt": created, "updatedAt": updated,
	}, nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func nzJSON(b []byte) []byte {
	if len(b) == 0 {
		return []byte("[]")
	}
	return b
}

func (s *Server) listCatalogCategories(c *gin.Context) {
	if _, err := s.loadUser(c.Request.Context(), principal(c).UID); err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT id, name_id, name_en, pillar,
			default_metric_unit_id, default_metric_unit_en,
			default_metric_label_id, default_metric_label_en,
			icon_name, sdgs, gri_standards, pojk_category, COALESCE(iso_reference,''),
			default_tips_id, default_tips_en
		FROM catalog_categories ORDER BY sort_order, id
	`)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, 16)
	for rows.Next() {
		var id, nameID, nameEN, pillar, unitID, unitEN, labelID, labelEN, icon, pojk, iso string
		var sdgs, gri, tipsID, tipsEN []byte
		if rows.Scan(&id, &nameID, &nameEN, &pillar, &unitID, &unitEN, &labelID, &labelEN,
			&icon, &sdgs, &gri, &pojk, &iso, &tipsID, &tipsEN) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "nameId": nameID, "nameEn": nameEN, "pillar": pillar,
			"defaultMetricUnitId": unitID, "defaultMetricUnitEn": unitEN,
			"defaultMetricLabelId": labelID, "defaultMetricLabelEn": labelEN,
			"iconName":     icon,
			"sdgs":         json.RawMessage(nzJSON(sdgs)),
			"griStandards": json.RawMessage(nzJSON(gri)),
			"pojkCategory": pojk, "isoReference": iso,
			"defaultTipsId": json.RawMessage(nzJSON(tipsID)),
			"defaultTipsEn": json.RawMessage(nzJSON(tipsEN)),
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"categories": list})
}
