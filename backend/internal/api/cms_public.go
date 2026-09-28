package api

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func cmsIDOK(id string) bool {
	if len(id) < 3 || len(id) > 80 {
		return false
	}
	for _, r := range id {
		if (r < 'a' || r > 'z') && (r < '0' || r > '9') && r != '_' && r != '-' {
			return false
		}
	}
	return true
}

func httpsURL(s string, max int) (string, bool) {
	return httpx.HTTPSURL(s, max)
}

func (s *Server) publicHero(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	if page.Limit > 10 {
		page.Limit = 10
	}
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_hero_slides WHERE is_published = true`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, subtitle, COALESCE(badge_text,''), category, COALESCE(image_url,''),
			overlay_gradient, impact_badge, COALESCE(cta_primary_text,''), COALESCE(cta_primary_action,''),
			target_article_id, cta_secondary_text, cta_secondary_action, sort_order, is_published
		FROM cms_hero_slides WHERE is_published = true
		ORDER BY sort_order, id LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
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
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"slides": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) publicArticles(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	cat := strings.TrimSpace(c.Query("category"))
	ctx := c.Request.Context()
	where := `is_published = true`
	args := []any{}
	n := 1
	if cat != "" && cat != "All" {
		where += ` AND category = ` + httpx.P(n)
		args = append(args, cat)
		n++
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_articles WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, subtitle, category, COALESCE(author,''), COALESCE(author_role,''),
			COALESCE(published_date,''), COALESCE(edition,''), COALESCE(read_time_minutes,3),
			cover_image_url, featured, is_published, tags, vendor_name, impact_highlight, likes_count
		FROM cms_articles WHERE `+where+`
		ORDER BY featured DESC, published_date DESC NULLS LAST, id
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		item, ok := scanArticleList(rows, false)
		if ok {
			list = append(list, item)
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"articles": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) publicArticle(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	item, err := s.loadArticle(c, id, true)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"article": item})
}

func (s *Server) likeArticle(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var likes int
	err := s.db.QueryRow(c.Request.Context(), `
		UPDATE cms_articles SET likes_count = likes_count + 1, updated_at = now()
		WHERE id = $1 AND is_published = true
		RETURNING likes_count
	`, id).Scan(&likes)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"likesCount": likes})
}

func (s *Server) publicGallery(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	cat := strings.TrimSpace(c.Query("category"))
	ctx := c.Request.Context()
	where := `is_published = true`
	args := []any{}
	n := 1
	if cat != "" && cat != "Semua" && cat != "All" {
		where += ` AND category = ` + httpx.P(n)
		args = append(args, cat)
		n++
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_gallery WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, COALESCE(hospital_unit,''), category, COALESCE(image_url,''), COALESCE(caption,''),
			COALESCE(year,''), metric_tag, is_published
		FROM cms_gallery WHERE `+where+` ORDER BY year DESC, id
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, title, unit, catv, img, cap, year string
		var tag *string
		var pub bool
		if rows.Scan(&id, &title, &unit, &catv, &img, &cap, &year, &tag, &pub) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "hospitalUnit": unit, "category": catv, "imageUrl": img,
			"caption": cap, "year": year, "metricTag": deref(tag), "isPublished": pub,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"items": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) publicGuides(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	pillar := strings.TrimSpace(c.Query("pillar"))
	ctx := c.Request.Context()
	where := `is_published = true`
	args := []any{}
	n := 1
	if pillar != "" && pillar != "All" {
		where += ` AND pillar = ` + httpx.P(n)
		args = append(args, pillar)
		n++
	}
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_guides WHERE `+where, args...).Scan(&total)
	args = append(args, page.Limit, page.Offset)
	rows, err := s.db.Query(ctx, `
		SELECT id, title, pillar, COALESCE(category,''), summary, key_takeaways,
			COALESCE(read_time_minutes,4), COALESCE(icon_name,''), COALESCE(target_audience,'')
		FROM cms_guides WHERE `+where+` ORDER BY title
		LIMIT `+httpx.P(n)+` OFFSET `+httpx.P(n+1), args...)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, title, pillarV, cat, summary, icon, aud string
		var takes []byte
		var mins int
		if rows.Scan(&id, &title, &pillarV, &cat, &summary, &takes, &mins, &icon, &aud) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "title": title, "pillar": pillarV, "category": cat, "summary": summary,
			"content": "", "keyTakeaways": jsonRaw(takes), "readTimeMinutes": mins,
			"iconName": icon, "targetAudience": aud,
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"guides": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) publicGuide(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if !cmsIDOK(id) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid id")
		return
	}
	var title, pillar, cat, summary, content, icon, aud string
	var takes []byte
	var mins int
	err := s.db.QueryRow(c.Request.Context(), `
		SELECT title, pillar, COALESCE(category,''), summary, content, key_takeaways,
			COALESCE(read_time_minutes,4), COALESCE(icon_name,''), COALESCE(target_audience,'')
		FROM cms_guides WHERE id = $1 AND is_published = true
	`, id).Scan(&title, &pillar, &cat, &summary, &content, &takes, &mins, &icon, &aud)
	if err != nil {
		httpx.Error(c.Writer, http.StatusNotFound, "not found")
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"guide": gin.H{
		"id": id, "title": title, "pillar": pillar, "category": cat, "summary": summary,
		"content": content, "keyTakeaways": jsonRaw(takes), "readTimeMinutes": mins,
		"iconName": icon, "targetAudience": aud,
	}})
}

func (s *Server) publicSpotlights(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cms_spotlights WHERE is_published = true`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, vendor_name, COALESCE(industry,''), COALESCE(location,''), COALESCE(maturity_level,''),
			COALESCE(badge_title,''), achievement_summary, COALESCE(metric_achieved,''), COALESCE(metric_label,''),
			COALESCE(quote,''), COALESCE(quote_person,''), facility_image_url, logo_url, is_published
		FROM cms_spotlights WHERE is_published = true
		ORDER BY vendor_name LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		item, ok := scanSpotlight(rows)
		if ok {
			list = append(list, item)
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"spotlights": list, "total": total, "limit": page.Limit, "offset": page.Offset})
}

func (s *Server) publicMetrics(c *gin.Context) {
	ctx := c.Request.Context()
	var vendors, verifiedVendors, verifiedActions int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendors`).Scan(&vendors)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(DISTINCT vendor_id) FROM vendor_actions WHERE status = 'Verified'`).Scan(&verifiedVendors)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendor_actions WHERE status = 'Verified'`).Scan(&verifiedActions)
	totals := emptyImpact()
	rows, err := s.db.Query(ctx, `
		SELECT ac.default_metric_name, SUM(COALESCE(va.quantity_reported,1) * COALESCE(ac.impact_multiplier,0))
		FROM vendor_actions va
		JOIN action_catalog ac ON ac.id = va.action_id
		WHERE va.status = 'Verified'
		GROUP BY ac.default_metric_name
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var key string
			var val float64
			if rows.Scan(&key, &val) != nil {
				continue
			}
			totals[key] = val
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"metrics": gin.H{
			"totalVendors":             vendors,
			"activeVendors":            verifiedVendors,
			"totalActionsCompleted":    verifiedActions,
			"totalVerifiedCommitments": verifiedActions,
			"totals":                   totals,
		},
		"vendorCount": vendors,
	})
}

func (s *Server) subscribe(c *gin.Context) {
	var body struct {
		Email        string `json:"email"`
		Name         string `json:"name"`
		Organization string `json:"organization"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if !httpx.ValidEmail(email) {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid email")
		return
	}
	name := strings.TrimSpace(body.Name)
	org := strings.TrimSpace(body.Organization)
	if len(name) > 120 {
		name = name[:120]
	}
	if len(org) > 200 {
		org = org[:200]
	}
	ctx := c.Request.Context()
	tag, err := s.db.Exec(ctx, `
		UPDATE newsletter_subscribers
		SET unsubscribed_at = NULL,
			name = COALESCE(NULLIF($2,''), name),
			organization = COALESCE(NULLIF($3,''), organization)
		WHERE lower(email) = $1
	`, email, name, org)
	if err != nil {
		httpx.Error(c.Writer, http.StatusInternalServerError, "subscribe failed")
		return
	}
	if tag.RowsAffected() == 0 {
		_, err = s.db.Exec(ctx, `
			INSERT INTO newsletter_subscribers (email, name, organization, consent_at)
			VALUES ($1,$2,$3, now())
		`, email, nullIfEmpty(name), nullIfEmpty(org))
		if err != nil {
			httpx.Error(c.Writer, http.StatusInternalServerError, "subscribe failed")
			return
		}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"success": true})
}

func scanArticleList(rows interface{ Scan(dest ...any) error }, withContent bool) (gin.H, bool) {
	var id, title, sub, cat, author, role, pubDate, edition string
	var cover, vendor *string
	var mins, likes int
	var featured, pub bool
	var tags, highlight []byte
	if withContent {
		return nil, false
	}
	if rows.Scan(&id, &title, &sub, &cat, &author, &role, &pubDate, &edition, &mins, &cover, &featured, &pub, &tags, &vendor, &highlight, &likes) != nil {
		return nil, false
	}
	return gin.H{
		"id": id, "title": title, "subtitle": sub, "content": "", "category": cat,
		"author": author, "authorRole": role, "publishedDate": pubDate, "edition": edition,
		"readTimeMinutes": mins, "coverImageUrl": deref(cover), "featured": featured,
		"isPublished": pub, "tags": jsonRaw(tags), "vendorName": deref(vendor),
		"impactHighlight": jsonObj(highlight), "likesCount": likes,
	}, true
}

func (s *Server) loadArticle(c *gin.Context, id string, publishedOnly bool) (gin.H, error) {
	q := `
		SELECT title, subtitle, content, category, COALESCE(author,''), COALESCE(author_role,''),
			COALESCE(published_date,''), COALESCE(edition,''), COALESCE(read_time_minutes,3),
			cover_image_url, featured, is_published, tags, vendor_name, impact_highlight, likes_count
		FROM cms_articles WHERE id = $1`
	if publishedOnly {
		q += ` AND is_published = true`
	}
	var title, sub, content, cat, author, role, pubDate, edition string
	var cover, vendor *string
	var mins, likes int
	var featured, pub bool
	var tags, highlight []byte
	err := s.db.QueryRow(c.Request.Context(), q, id).Scan(
		&title, &sub, &content, &cat, &author, &role, &pubDate, &edition, &mins,
		&cover, &featured, &pub, &tags, &vendor, &highlight, &likes)
	if err != nil {
		return nil, err
	}
	return gin.H{
		"id": id, "title": title, "subtitle": sub, "content": content, "category": cat,
		"author": author, "authorRole": role, "publishedDate": pubDate, "edition": edition,
		"readTimeMinutes": mins, "coverImageUrl": deref(cover), "featured": featured,
		"isPublished": pub, "tags": jsonRaw(tags), "vendorName": deref(vendor),
		"impactHighlight": jsonObj(highlight), "likesCount": likes,
	}, nil
}

func scanSpotlight(rows interface{ Scan(dest ...any) error }) (gin.H, bool) {
	var id, name, ind, loc, mat, badge, summary, metric, label, quote, person string
	var fac, logo *string
	var pub bool
	if rows.Scan(&id, &name, &ind, &loc, &mat, &badge, &summary, &metric, &label, &quote, &person, &fac, &logo, &pub) != nil {
		return nil, false
	}
	return gin.H{
		"id": id, "vendorName": name, "industry": ind, "location": loc, "maturityLevel": mat,
		"badgeTitle": badge, "achievementSummary": summary, "metricAchieved": metric,
		"metricLabel": label, "quote": quote, "quotePerson": person,
		"facilityImageUrl": deref(fac), "logoUrl": deref(logo), "isPublished": pub,
	}, true
}
