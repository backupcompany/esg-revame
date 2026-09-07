package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func (s *Server) adminHeroList(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	c.Request.URL.RawQuery = "limit=50&offset=0&" + c.Request.URL.RawQuery
	ctx := c.Request.Context()
	page := httpx.ParsePage(c.Request)
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_hero_slides`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, subtitle, COALESCE(badge_text,''), category, COALESCE(image_url,''),
			overlay_gradient, impact_badge, COALESCE(cta_primary_text,''), COALESCE(cta_primary_action,''),
			target_article_id, cta_secondary_text, cta_secondary_action, sort_order, is_published
		FROM cms_hero_slides ORDER BY sort_order, id LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		var id, title, sub, badge, cat, img, grad, ctaT, ctaA string
		var target, cta2t, cta2a *string
		var badgeJSON []byte
		var order int
		var pub bool
		if rows.Scan(&id, &title, &sub, &badge, &cat, &img, &grad, &badgeJSON, &ctaT, &ctaA, &target, &cta2t, &cta2a, &order, &pub) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "subtitle": sub, "badgeText": badge, "category": cat,
			"imageUrl": img, "overlayGradient": grad, "impactBadge": jsonObj(badgeJSON),
			"ctaPrimaryText": ctaT, "ctaPrimaryAction": ctaA, "targetArticleId": deref(target),
			"ctaSecondaryText": deref(cta2t), "ctaSecondaryAction": deref(cta2a),
			"order": order, "isPublished": pub,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"slides": list, "total": total})
}

func (s *Server) upsertHero(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		ID                 string          `json:"id"`
		Title              string          `json:"title"`
		Subtitle           string          `json:"subtitle"`
		BadgeText          string          `json:"badgeText"`
		Category           string          `json:"category"`
		ImageURL           string          `json:"imageUrl"`
		OverlayGradient    string          `json:"overlayGradient"`
		ImpactBadge        json.RawMessage `json:"impactBadge"`
		CtaPrimaryText     string          `json:"ctaPrimaryText"`
		CtaPrimaryAction   string          `json:"ctaPrimaryAction"`
		TargetArticleID    string          `json:"targetArticleId"`
		CtaSecondaryText   string          `json:"ctaSecondaryText"`
		CtaSecondaryAction string          `json:"ctaSecondaryAction"`
		Order              int             `json:"order"`
		IsPublished        bool            `json:"isPublished"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.Title = strings.TrimSpace(body.Title)
	if !cmsIDOK(body.ID) || body.Title == "" || len(body.Title) > 300 {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
		return
	}
	img, okURL := httpsURL(body.ImageURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "imageUrl must be https")
		return
	}
	if body.OverlayGradient == "" {
		body.OverlayGradient = "emerald"
	}
	if !json.Valid(body.ImpactBadge) {
		body.ImpactBadge = nil
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO cms_hero_slides (
			id, title, subtitle, badge_text, category, image_url, overlay_gradient, impact_badge,
			cta_primary_text, cta_primary_action, target_article_id, cta_secondary_text,
			cta_secondary_action, sort_order, is_published, updated_by, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now())
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, badge_text=EXCLUDED.badge_text,
			category=EXCLUDED.category, image_url=EXCLUDED.image_url, overlay_gradient=EXCLUDED.overlay_gradient,
			impact_badge=EXCLUDED.impact_badge, cta_primary_text=EXCLUDED.cta_primary_text,
			cta_primary_action=EXCLUDED.cta_primary_action, target_article_id=EXCLUDED.target_article_id,
			cta_secondary_text=EXCLUDED.cta_secondary_text, cta_secondary_action=EXCLUDED.cta_secondary_action,
			sort_order=EXCLUDED.sort_order, is_published=EXCLUDED.is_published,
			updated_by=EXCLUDED.updated_by, updated_at=now()
	`, body.ID, body.Title, body.Subtitle, nullIfEmpty(body.BadgeText), body.Category, nullIfEmpty(img),
		body.OverlayGradient, nullJSONBytes(body.ImpactBadge), nullIfEmpty(body.CtaPrimaryText),
		nullIfEmpty(body.CtaPrimaryAction), nullIfEmpty(body.TargetArticleID),
		nullIfEmpty(body.CtaSecondaryText), nullIfEmpty(body.CtaSecondaryAction),
		body.Order, body.IsPublished, user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_publish", "hero", body.ID, nil, body.IsPublished)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteHero(c *gin.Context) {
	s.deleteCMS(c, "cms_hero_slides", "hero")
}

func (s *Server) adminArticles(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_articles`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, subtitle, category, COALESCE(author,''), COALESCE(author_role,''),
			COALESCE(published_date,''), COALESCE(edition,''), COALESCE(read_time_minutes,3),
			cover_image_url, featured, is_published, tags, vendor_name, impact_highlight, likes_count
		FROM cms_articles ORDER BY updated_at DESC LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		item, ok := scanArticleList(rows, false)
		if ok {
			list = append(list, item)
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"articles": list, "total": total})
}

func (s *Server) adminArticle(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	item, err := s.loadArticle(c, id, false)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"article": item})
}

func (s *Server) upsertArticle(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		ID              string          `json:"id"`
		Title           string          `json:"title"`
		Subtitle        string          `json:"subtitle"`
		Content         string          `json:"content"`
		Category        string          `json:"category"`
		Author          string          `json:"author"`
		AuthorRole      string          `json:"authorRole"`
		PublishedDate   string          `json:"publishedDate"`
		Edition         string          `json:"edition"`
		ReadTimeMinutes int             `json:"readTimeMinutes"`
		CoverImageURL   string          `json:"coverImageUrl"`
		Featured        bool            `json:"featured"`
		IsPublished     bool            `json:"isPublished"`
		Tags            json.RawMessage `json:"tags"`
		VendorName      string          `json:"vendorName"`
		ImpactHighlight json.RawMessage `json:"impactHighlight"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.Title = strings.TrimSpace(body.Title)
	if !cmsIDOK(body.ID) || body.Title == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
		return
	}
	if len(body.Content) > 64<<10 {
		httpx.Error(c.Writer, http.StatusBadRequest, "content too large")
		return
	}
	cover, okURL := httpsURL(body.CoverImageURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "coverImageUrl must be https")
		return
	}
	if !json.Valid(body.Tags) {
		body.Tags = []byte("[]")
	}
	if !json.Valid(body.ImpactHighlight) {
		body.ImpactHighlight = nil
	}
	if body.ReadTimeMinutes < 1 || body.ReadTimeMinutes > 60 {
		body.ReadTimeMinutes = 3
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO cms_articles (
			id, title, subtitle, content, category, author, author_role, published_date, edition,
			read_time_minutes, cover_image_url, featured, is_published, tags, vendor_name,
			impact_highlight, updated_by, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now())
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
			content = CASE WHEN length(EXCLUDED.content) = 0 THEN cms_articles.content ELSE EXCLUDED.content END,
			category=EXCLUDED.category, author=EXCLUDED.author, author_role=EXCLUDED.author_role,
			published_date=EXCLUDED.published_date, edition=EXCLUDED.edition,
			read_time_minutes=EXCLUDED.read_time_minutes, cover_image_url=EXCLUDED.cover_image_url,
			featured=EXCLUDED.featured, is_published=EXCLUDED.is_published, tags=EXCLUDED.tags,
			vendor_name=EXCLUDED.vendor_name, impact_highlight=EXCLUDED.impact_highlight,
			updated_by=EXCLUDED.updated_by, updated_at=now()
	`, body.ID, body.Title, body.Subtitle, body.Content, body.Category, nullIfEmpty(body.Author),
		nullIfEmpty(body.AuthorRole), nullIfEmpty(body.PublishedDate), nullIfEmpty(body.Edition),
		body.ReadTimeMinutes, nullIfEmpty(cover), body.Featured, body.IsPublished, body.Tags,
		nullIfEmpty(body.VendorName), nullJSONBytes(body.ImpactHighlight), user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_publish", "article", body.ID, nil, body.IsPublished)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteArticle(c *gin.Context) { s.deleteCMS(c, "cms_articles", "article") }

func (s *Server) upsertGallery(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		ID           string `json:"id"`
		Title        string `json:"title"`
		HospitalUnit string `json:"hospitalUnit"`
		Category     string `json:"category"`
		ImageURL     string `json:"imageUrl"`
		Caption      string `json:"caption"`
		Year         string `json:"year"`
		MetricTag    string `json:"metricTag"`
		IsPublished  bool   `json:"isPublished"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.Title = strings.TrimSpace(body.Title)
	if !cmsIDOK(body.ID) || body.Title == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
		return
	}
	img, okURL := httpsURL(body.ImageURL, 500)
	if !okURL {
		httpx.Error(c.Writer, http.StatusBadRequest, "imageUrl must be https")
		return
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO cms_gallery (id, title, hospital_unit, category, image_url, caption, year, metric_tag, is_published, updated_by, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, hospital_unit=EXCLUDED.hospital_unit, category=EXCLUDED.category,
			image_url=EXCLUDED.image_url, caption=EXCLUDED.caption, year=EXCLUDED.year,
			metric_tag=EXCLUDED.metric_tag, is_published=EXCLUDED.is_published,
			updated_by=EXCLUDED.updated_by, updated_at=now()
	`, body.ID, body.Title, nullIfEmpty(body.HospitalUnit), body.Category, nullIfEmpty(img),
		nullIfEmpty(body.Caption), nullIfEmpty(body.Year), nullIfEmpty(body.MetricTag), body.IsPublished, user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_publish", "gallery", body.ID, nil, body.IsPublished)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteGallery(c *gin.Context) { s.deleteCMS(c, "cms_gallery", "gallery") }

func (s *Server) upsertGuide(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		ID              string          `json:"id"`
		Title           string          `json:"title"`
		Pillar          string          `json:"pillar"`
		Category        string          `json:"category"`
		Summary         string          `json:"summary"`
		Content         string          `json:"content"`
		KeyTakeaways    json.RawMessage `json:"keyTakeaways"`
		ReadTimeMinutes int             `json:"readTimeMinutes"`
		IconName        string          `json:"iconName"`
		TargetAudience  string          `json:"targetAudience"`
		IsPublished     *bool           `json:"isPublished"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.Title = strings.TrimSpace(body.Title)
	if !cmsIDOK(body.ID) || body.Title == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and title required")
		return
	}
	if body.Pillar != "E" && body.Pillar != "S" && body.Pillar != "G" && body.Pillar != "General" {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid pillar")
		return
	}
	if len(body.Content) > 64<<10 {
		httpx.Error(c.Writer, http.StatusBadRequest, "content too large")
		return
	}
	if !json.Valid(body.KeyTakeaways) {
		body.KeyTakeaways = []byte("[]")
	}
	pub := true
	if body.IsPublished != nil {
		pub = *body.IsPublished
	}
	if body.ReadTimeMinutes < 1 {
		body.ReadTimeMinutes = 4
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO cms_guides (
			id, title, pillar, category, summary, content, key_takeaways, read_time_minutes,
			icon_name, target_audience, is_published, updated_by, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, pillar=EXCLUDED.pillar, category=EXCLUDED.category,
			summary=EXCLUDED.summary,
			content = CASE WHEN length(EXCLUDED.content) = 0 THEN cms_guides.content ELSE EXCLUDED.content END,
			key_takeaways=EXCLUDED.key_takeaways,
			read_time_minutes=EXCLUDED.read_time_minutes, icon_name=EXCLUDED.icon_name,
			target_audience=EXCLUDED.target_audience, is_published=EXCLUDED.is_published,
			updated_by=EXCLUDED.updated_by, updated_at=now()
	`, body.ID, body.Title, body.Pillar, nullIfEmpty(body.Category), body.Summary, body.Content,
		body.KeyTakeaways, body.ReadTimeMinutes, nullIfEmpty(body.IconName),
		nullIfEmpty(body.TargetAudience), pub, user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_publish", "guide", body.ID, nil, pub)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteGuide(c *gin.Context) { s.deleteCMS(c, "cms_guides", "guide") }

func (s *Server) upsertSpotlight(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		ID                 string `json:"id"`
		VendorName         string `json:"vendorName"`
		Industry           string `json:"industry"`
		Location           string `json:"location"`
		MaturityLevel      string `json:"maturityLevel"`
		BadgeTitle         string `json:"badgeTitle"`
		AchievementSummary string `json:"achievementSummary"`
		MetricAchieved     string `json:"metricAchieved"`
		MetricLabel        string `json:"metricLabel"`
		Quote              string `json:"quote"`
		QuotePerson        string `json:"quotePerson"`
		FacilityImageURL   string `json:"facilityImageUrl"`
		LogoURL            string `json:"logoUrl"`
		IsPublished        bool   `json:"isPublished"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ID = strings.TrimSpace(body.ID)
	body.VendorName = strings.TrimSpace(body.VendorName)
	if !cmsIDOK(body.ID) || body.VendorName == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "id and vendorName required")
		return
	}
	fac, ok1 := httpsURL(body.FacilityImageURL, 500)
	logo, ok2 := httpsURL(body.LogoURL, 500)
	if !ok1 || !ok2 {
		httpx.Error(c.Writer, http.StatusBadRequest, "image urls must be https")
		return
	}
	_, err := s.db.Exec(c.Request.Context(), `
		INSERT INTO cms_spotlights (
			id, vendor_name, industry, location, maturity_level, badge_title, achievement_summary,
			metric_achieved, metric_label, quote, quote_person, facility_image_url, logo_url,
			is_published, updated_by, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
		ON CONFLICT (id) DO UPDATE SET
			vendor_name=EXCLUDED.vendor_name, industry=EXCLUDED.industry, location=EXCLUDED.location,
			maturity_level=EXCLUDED.maturity_level, badge_title=EXCLUDED.badge_title,
			achievement_summary=EXCLUDED.achievement_summary, metric_achieved=EXCLUDED.metric_achieved,
			metric_label=EXCLUDED.metric_label, quote=EXCLUDED.quote, quote_person=EXCLUDED.quote_person,
			facility_image_url=EXCLUDED.facility_image_url, logo_url=EXCLUDED.logo_url,
			is_published=EXCLUDED.is_published, updated_by=EXCLUDED.updated_by, updated_at=now()
	`, body.ID, body.VendorName, nullIfEmpty(body.Industry), nullIfEmpty(body.Location),
		nullIfEmpty(body.MaturityLevel), nullIfEmpty(body.BadgeTitle), body.AchievementSummary,
		nullIfEmpty(body.MetricAchieved), nullIfEmpty(body.MetricLabel), nullIfEmpty(body.Quote),
		nullIfEmpty(body.QuotePerson), nullIfEmpty(fac), nullIfEmpty(logo), body.IsPublished, user.ID)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "upsert failed")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_publish", "spotlight", body.ID, nil, body.IsPublished)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true, "id": body.ID})
}

func (s *Server) deleteSpotlight(c *gin.Context) { s.deleteCMS(c, "cms_spotlights", "spotlight") }

func (s *Server) adminSubscribers(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed_at IS NULL`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, email, COALESCE(name,''), COALESCE(organization,''), consent_at
		FROM newsletter_subscribers WHERE unsubscribed_at IS NULL
		ORDER BY consent_at DESC LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		var id int
		var email, name, org string
		var at any
		if rows.Scan(&id, &email, &name, &org, &at) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": idStr(id), "email": email, "name": name, "organization": org, "subscribedAt": at,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"subscribers": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) deleteCMS(c *gin.Context, table, entity string) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var q string
	switch table {
	case "cms_hero_slides", "cms_articles", "cms_gallery", "cms_guides", "cms_spotlights":
		q = `DELETE FROM ` + table + ` WHERE id = $1`
	default:
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid table")
		return
	}
	tag, err := s.db.Exec(c.Request.Context(), q, id)
	if err != nil || tag.RowsAffected() == 0 {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	s.writeAudit(c.Request.Context(), user.ID, "cms_delete", entity, id, nil, nil)
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func (s *Server) adminGallery(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_gallery`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, COALESCE(hospital_unit,''), category, COALESCE(image_url,''), COALESCE(caption,''),
			COALESCE(year,''), metric_tag, is_published
		FROM cms_gallery ORDER BY year DESC, id LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		var id, title, unit, cat, img, cap, year string
		var tag *string
		var pub bool
		if rows.Scan(&id, &title, &unit, &cat, &img, &cap, &year, &tag, &pub) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "hospitalUnit": unit, "category": cat, "imageUrl": img,
			"caption": cap, "year": year, "metricTag": deref(tag), "isPublished": pub,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"items": list, "total": total})
}

func (s *Server) adminGuides(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_guides`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, pillar, COALESCE(category,''), summary, key_takeaways,
			COALESCE(read_time_minutes,4), COALESCE(icon_name,''), COALESCE(target_audience,''), is_published
		FROM cms_guides ORDER BY title LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		var id, title, pillar, cat, summary, icon, aud string
		var takes []byte
		var mins int
		var pub bool
		if rows.Scan(&id, &title, &pillar, &cat, &summary, &takes, &mins, &icon, &aud, &pub) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "pillar": pillar, "category": cat, "summary": summary,
			"content": "", "keyTakeaways": jsonRaw(takes), "readTimeMinutes": mins,
			"iconName": icon, "targetAudience": aud, "isPublished": pub,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"guides": list, "total": total})
}

func (s *Server) adminGuide(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var title, pillar, cat, summary, content, icon, aud string
	var takes []byte
	var mins int
	var pub bool
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT title, pillar, COALESCE(category,''), summary, content, key_takeaways,
			COALESCE(read_time_minutes,4), COALESCE(icon_name,''), COALESCE(target_audience,''), is_published
		FROM cms_guides WHERE id = $1
	`, id).Scan(&title, &pillar, &cat, &summary, &content, &takes, &mins, &icon, &aud, &pub)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"guide": gin.H{
		"id": id, "title": title, "pillar": pillar, "category": cat, "summary": summary,
		"content": content, "keyTakeaways": jsonRaw(takes), "readTimeMinutes": mins,
		"iconName": icon, "targetAudience": aud, "isPublished": pub,
	}})
}

func (s *Server) adminSpotlights(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_spotlights`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, vendor_name, COALESCE(industry,''), COALESCE(location,''), COALESCE(maturity_level,''),
			COALESCE(badge_title,''), achievement_summary, COALESCE(metric_achieved,''), COALESCE(metric_label,''),
			COALESCE(quote,''), COALESCE(quote_person,''), facility_image_url, logo_url, is_published
		FROM cms_spotlights ORDER BY vendor_name LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0)
	for rows.Next() {
		item, ok := scanSpotlight(rows)
		if ok {
			list = append(list, item)
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"spotlights": list, "total": total})
}
