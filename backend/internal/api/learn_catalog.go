package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func moduleIDOK(id string) bool {
	return catalogIDOK(id)
}

func (s *Server) listLearnModules(c *gin.Context) {
	user, err := s.loadUser(c.Request.Context(), principal(c).UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	page := httpx.ParsePage(c.Request)
	pillar := strings.TrimSpace(c.Query("pillar"))
	ctx := c.Request.Context()
	where := `m.status = 'published'`
	args := []any{}
	vendorPos := 1
	if pillar != "" && pillar != "ALL" {
		if _, ok := allowedPillar[pillar]; !ok {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
			return
		}
		where += ` AND m.pillar = $1`
		args = append(args, pillar)
		vendorPos = 2
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM learning_modules m WHERE `+where, args...).Scan(&total)

	var vendorArg any
	if user.VendorID != nil {
		vendorArg = *user.VendorID
	}
	args = append(args, vendorArg, page.Limit, page.Offset)
	q := `
		SELECT m.id, m.title, m.title_id, m.description, m.description_id, m.pillar,
			m.duration_minutes, m.points, m.badge_icon, m.cover_image_url, m.industry_sector,
			m.difficulty, m.linked_action_ids, COALESCE(p.completed, false),
			COALESCE(jsonb_array_length(m.lessons), 0)
		FROM learning_modules m
		LEFT JOIN learning_progress p ON p.module_id = m.id AND p.vendor_id = ` + httpx.P(vendorPos) + `
		WHERE ` + where + `
		ORDER BY m.title
		LIMIT ` + httpx.P(vendorPos+1) + ` OFFSET ` + httpx.P(vendorPos+2)
	rows, err := s.db.Query(ctx, q, args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, title, pillar string
		var titleID, desc, descID, badge, cover, industry, diff *string
		var mins, points, lessonCount int
		var linked []byte
		var completed bool
		if rows.Scan(&id, &title, &titleID, &desc, &descID, &pillar, &mins, &points, &badge, &cover, &industry, &diff, &linked, &completed, &lessonCount) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "titleId": deref(titleID), "description": deref(desc),
			"descriptionId": deref(descID), "pillar": pillar, "durationMinutes": mins, "points": points,
			"badgeIcon": deref(badge), "coverImageUrl": deref(cover), "industrySector": deref(industry),
			"difficulty": deref(diff), "linkedActionIds": jsonRaw(linked),
			"completed": completed, "lessons": []any{}, "lessonCount": lessonCount, "status": "published", "levelRequired": 0,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"modules": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}

func (s *Server) getLearnModule(c *gin.Context) {
	user, err := s.loadUser(c.Request.Context(), principal(c).UID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "User not found")
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !moduleIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var title, pillar string
	var titleID, desc, descID, badge, cover, industry, diff, status *string
	var mins, points int
	var linked, lessons []byte
	err = s.db.QueryRow(c.Request.Context(), `
		SELECT title, title_id, description, description_id, pillar, duration_minutes, points,
			badge_icon, cover_image_url, industry_sector, difficulty, linked_action_ids, status, lessons
		FROM learning_modules WHERE id = $1
	`, id).Scan(&title, &titleID, &desc, &descID, &pillar, &mins, &points, &badge, &cover, &industry, &diff, &linked, &status, &lessons)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "module not found")
		return
	}
	completed := false
	if user.VendorID != nil {
		_ = s.db.QueryRow(c.Request.Context(), `
			SELECT COALESCE(completed,false) FROM learning_progress WHERE vendor_id=$1 AND module_id=$2
		`, *user.VendorID, id).Scan(&completed)
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"module": gin.H{
		"id": id, "title": title, "titleId": deref(titleID), "description": deref(desc),
		"descriptionId": deref(descID), "pillar": pillar, "durationMinutes": mins, "points": points,
		"badgeIcon": deref(badge), "coverImageUrl": deref(cover), "industrySector": deref(industry),
		"difficulty": deref(diff), "linkedActionIds": jsonRaw(linked),
		"status": deref(status), "lessons": json.RawMessage(nzJSON(lessons)),
		"completed": completed, "levelRequired": 0,
	}})
}

func (s *Server) upsertLearnModule(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	var body struct {
		ID              string          `json:"id"`
		Title           string          `json:"title"`
		TitleID         string          `json:"titleId"`
		Description     string          `json:"description"`
		DescriptionID   string          `json:"descriptionId"`
		Pillar          string          `json:"pillar"`
		DurationMinutes int             `json:"durationMinutes"`
		Points          int             `json:"points"`
		BadgeIcon       string          `json:"badgeIcon"`
		CoverImageURL   string          `json:"coverImageUrl"`
		IndustrySector  string          `json:"industrySector"`
		Difficulty      string          `json:"difficulty"`
		LinkedActionIDs json.RawMessage `json:"linkedActionIds"`
		Status          string          `json:"status"`
		Lessons         json.RawMessage `json:"lessons"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.Title = strings.TrimSpace(body.Title)
	if !moduleIDOK(body.ID) || body.Title == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
		return
	}
	if _, ok := allowedPillar[body.Pillar]; !ok {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
		return
	}
	if body.Status == "" {
		body.Status = "published"
	}
	if body.Status != "published" && body.Status != "draft" {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid status")
		return
	}
	if len(body.Lessons) > 512<<10 {
		httpx.Error(c.Writer, http.StatusBadRequest, "lessons too large")
		return
	}
	if !json.Valid(body.Lessons) {
		body.Lessons = []byte("[]")
	}
	if !json.Valid(body.LinkedActionIDs) {
		body.LinkedActionIDs = []byte("[]")
	}
	if body.DurationMinutes < 0 || body.DurationMinutes > 600 {
		body.DurationMinutes = 5
	}
	if body.Points < 0 || body.Points > 10000 {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid points")
		return
	}
	cover, okURL := httpx.HTTPSURL(body.CoverImageURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "coverImageUrl must be https")
		return
	}
	body.CoverImageURL = cover
	body.Lessons = sanitizeLessonAssets(body.Lessons)
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO learning_modules (
			id, title, title_id, description, description_id, pillar, duration_minutes,
			points, badge_icon, cover_image_url, industry_sector, difficulty,
			linked_action_ids, status, lessons, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, title_id=EXCLUDED.title_id, description=EXCLUDED.description,
			description_id=EXCLUDED.description_id, pillar=EXCLUDED.pillar,
			duration_minutes=EXCLUDED.duration_minutes, points=EXCLUDED.points,
			badge_icon=EXCLUDED.badge_icon, cover_image_url=EXCLUDED.cover_image_url,
			industry_sector=EXCLUDED.industry_sector, difficulty=EXCLUDED.difficulty,
			linked_action_ids=EXCLUDED.linked_action_ids, status=EXCLUDED.status,
			lessons=EXCLUDED.lessons, updated_at=now()
	`, body.ID, body.Title, nullIfEmpty(body.TitleID), body.Description, nullIfEmpty(body.DescriptionID),
		body.Pillar, body.DurationMinutes, body.Points, nullIfEmpty(body.BadgeIcon),
		nullIfEmpty(body.CoverImageURL), nullIfEmpty(body.IndustrySector), nullIfEmpty(body.Difficulty),
		body.LinkedActionIDs, body.Status, body.Lessons)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteLearnModule(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !moduleIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	_, err := s.db.Exec(c.Request.Context(), `UPDATE learning_modules SET status='draft', updated_at=now() WHERE id=$1`, id)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "update failed")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func sanitizeLessonAssets(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return []byte("[]")
	}
	var lessons []map[string]any
	if json.Unmarshal(raw, &lessons) != nil {
		return raw
	}
	for _, les := range lessons {
		if les == nil {
			continue
		}
		les["mediaType"] = "image"
		u, _ := les["mediaUrl"].(string)
		got, ok := httpx.HTTPSURL(u, 500)
		if !ok {
			delete(les, "mediaUrl")
			continue
		}
		les["mediaUrl"] = got
	}
	out, err := json.Marshal(lessons)
	if err != nil {
		return []byte("[]")
	}
	return out
}
