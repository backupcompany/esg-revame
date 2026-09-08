package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"esg-together/backend/internal/authn"
)

func IfEmpty(ctx context.Context, pool *pgxpool.Pool, testEmail string) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM action_catalog`).Scan(&n); err != nil {
		return fmt.Errorf("action_catalog: %w", err)
	}
	if n == 0 {
		if err := seedActions(ctx, pool); err != nil {
			return err
		}
	}
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM learning_modules`).Scan(&n); err != nil {
		return fmt.Errorf("learning_modules: %w", err)
	}
	if n == 0 {
		if err := seedModules(ctx, pool); err != nil {
			return err
		}
	}
	if err := seedCMS(ctx, pool); err != nil {
		return err
	}
	if err := seedCoC(ctx, pool); err != nil {
		return err
	}
	if err := seedQuestions(ctx, pool); err != nil {
		return err
	}
	if err := seedCategories(ctx, pool); err != nil {
		return err
	}
	if err := seedTestAllowlist(ctx, pool, testEmail); err != nil {
		return err
	}
	return seedUATAccounts(ctx, pool)
}

func seedTestAllowlist(ctx context.Context, pool *pgxpool.Pool, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || !strings.Contains(email, "@") {
		return nil
	}
	_, err := pool.Exec(ctx, `
		INSERT INTO vendor_allowed_emails (vendor_id, email)
		SELECT v.id, $1
		FROM vendors v
		WHERE v.id = (SELECT id FROM vendors ORDER BY id ASC LIMIT 1)
		  AND NOT EXISTS (
			SELECT 1 FROM vendor_allowed_emails WHERE lower(email) = $1
		  )
	`, email)
	return err
}

func seedUATAccounts(ctx context.Context, pool *pgxpool.Pool) error {
	var vendorID *int
	var id int
	if pool.QueryRow(ctx, `SELECT id FROM vendors WHERE company_name = 'PT Nusantara Pro' LIMIT 1`).Scan(&id) == nil {
		vendorID = &id
	} else if pool.QueryRow(ctx, `SELECT id FROM vendors ORDER BY id LIMIT 1`).Scan(&id) == nil {
		vendorID = &id
	}
	for _, a := range authn.UATAccounts {
		var vid any
		if a.Vendor && vendorID != nil {
			vid = *vendorID
		}
		if _, err := pool.Exec(ctx, `
			INSERT INTO users (uid, email, name, role, vendor_id)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (uid) DO UPDATE
			SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
			    vendor_id = COALESCE(EXCLUDED.vendor_id, users.vendor_id)
		`, a.UID, a.Email, a.Name, a.Role, vid); err != nil {
			return fmt.Errorf("uat user %s: %w", a.Email, err)
		}
		if a.Vendor && vendorID != nil {
			if _, err := pool.Exec(ctx, `
				INSERT INTO vendor_allowed_emails (vendor_id, email)
				SELECT $1, $2
				WHERE NOT EXISTS (
					SELECT 1 FROM vendor_allowed_emails WHERE lower(email) = $2
				)
			`, *vendorID, a.Email); err != nil {
				return fmt.Errorf("uat allowlist %s: %w", a.Email, err)
			}
		}
	}
	return nil
}

func seedActions(ctx context.Context, pool *pgxpool.Pool) error {
	var rows []struct {
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
		IsActive             bool     `json:"isActive"`
		Source               string   `json:"source"`
	}
	if err := json.Unmarshal(actionsJSON, &rows); err != nil {
		return fmt.Errorf("parse actions seed: %w", err)
	}
	for _, a := range rows {
		tips, err := json.Marshal(a.PracticalTips)
		if err != nil {
			return err
		}
		tipsID, err := json.Marshal(a.PracticalTipsID)
		if err != nil {
			return err
		}
		if a.Source == "" {
			a.Source = "system"
		}
		_, err = pool.Exec(ctx, `
			INSERT INTO action_catalog (
				id, title, title_id, description, description_id, pillar, category, category_id,
				difficulty, estimated_days, impact_metric_unit, impact_metric_unit_id,
				impact_metric_label, impact_metric_label_id, default_metric_name, impact_multiplier,
				icon_name, image_url, practical_tips, practical_tips_id, required_evidence_type,
				points, is_active, source
			) VALUES (
				$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
			) ON CONFLICT (id) DO NOTHING
		`, a.ID, a.Title, a.TitleID, a.Description, a.DescriptionID, a.Pillar, a.Category, a.CategoryID,
			a.Difficulty, a.EstimatedDays, a.ImpactMetricUnit, a.ImpactMetricUnitID,
			a.ImpactMetricLabel, a.ImpactMetricLabelID, a.DefaultMetricName, a.ImpactMultiplier,
			a.IconName, a.ImageURL, tips, tipsID, a.RequiredEvidenceType,
			a.Points, a.IsActive, a.Source)
		if err != nil {
			return fmt.Errorf("seed action %s: %w", a.ID, err)
		}
	}
	return nil
}

func seedModules(ctx context.Context, pool *pgxpool.Pool) error {
	var rows []struct {
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
	if err := json.Unmarshal(modulesJSON, &rows); err != nil {
		return fmt.Errorf("parse modules seed: %w", err)
	}
	for _, m := range rows {
		if !json.Valid(m.LinkedActionIDs) {
			m.LinkedActionIDs = []byte("[]")
		}
		if !json.Valid(m.Lessons) {
			m.Lessons = []byte("[]")
		}
		if m.Status == "" {
			m.Status = "published"
		}
		_, err := pool.Exec(ctx, `
			INSERT INTO learning_modules (
				id, title, title_id, description, description_id, pillar, duration_minutes,
				points, badge_icon, cover_image_url, industry_sector, difficulty,
				linked_action_ids, status, lessons
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
			ON CONFLICT (id) DO NOTHING
		`, m.ID, m.Title, m.TitleID, m.Description, m.DescriptionID, m.Pillar, m.DurationMinutes,
			m.Points, m.BadgeIcon, m.CoverImageURL, m.IndustrySector, m.Difficulty,
			m.LinkedActionIDs, m.Status, m.Lessons)
		if err != nil {
			return fmt.Errorf("seed module %s: %w", m.ID, err)
		}
	}
	return nil
}

func seedCMS(ctx context.Context, pool *pgxpool.Pool) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms_hero_slides`).Scan(&n); err != nil {
		return fmt.Errorf("cms_hero_slides: %w", err)
	}
	if n == 0 {
		var slides []struct {
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
		if err := json.Unmarshal(heroJSON, &slides); err != nil {
			return fmt.Errorf("parse hero: %w", err)
		}
		for _, s := range slides {
			if !json.Valid(s.ImpactBadge) {
				s.ImpactBadge = nil
			}
			_, err := pool.Exec(ctx, `
				INSERT INTO cms_hero_slides (
					id, title, subtitle, badge_text, category, image_url, overlay_gradient,
					impact_badge, cta_primary_text, cta_primary_action, target_article_id,
					cta_secondary_text, cta_secondary_action, sort_order, is_published
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
				ON CONFLICT (id) DO NOTHING
			`, s.ID, s.Title, s.Subtitle, s.BadgeText, s.Category, s.ImageURL, s.OverlayGradient,
				nullJSON(s.ImpactBadge), s.CtaPrimaryText, s.CtaPrimaryAction, nullIfEmptySeed(s.TargetArticleID),
				nullIfEmptySeed(s.CtaSecondaryText), nullIfEmptySeed(s.CtaSecondaryAction), s.Order, s.IsPublished)
			if err != nil {
				return fmt.Errorf("seed hero %s: %w", s.ID, err)
			}
		}
	}

	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms_gallery`).Scan(&n); err != nil {
		return err
	}
	if n == 0 {
		var items []struct {
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
		if err := json.Unmarshal(galleryJSON, &items); err != nil {
			return fmt.Errorf("parse gallery: %w", err)
		}
		for _, g := range items {
			_, err := pool.Exec(ctx, `
				INSERT INTO cms_gallery (id, title, hospital_unit, category, image_url, caption, year, metric_tag, is_published)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING
			`, g.ID, g.Title, g.HospitalUnit, g.Category, g.ImageURL, g.Caption, g.Year, nullIfEmptySeed(g.MetricTag), g.IsPublished)
			if err != nil {
				return fmt.Errorf("seed gallery %s: %w", g.ID, err)
			}
		}
	}

	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms_articles`).Scan(&n); err != nil {
		return err
	}
	if n == 0 {
		var arts []struct {
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
			LikesCount      int             `json:"likesCount"`
		}
		if err := json.Unmarshal(articlesJSON, &arts); err != nil {
			return fmt.Errorf("parse articles: %w", err)
		}
		for _, a := range arts {
			if !json.Valid(a.Tags) {
				a.Tags = []byte("[]")
			}
			if !json.Valid(a.ImpactHighlight) {
				a.ImpactHighlight = nil
			}
			_, err := pool.Exec(ctx, `
				INSERT INTO cms_articles (
					id, title, subtitle, content, category, author, author_role, published_date,
					edition, read_time_minutes, cover_image_url, featured, is_published, tags,
					vendor_name, impact_highlight, likes_count
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
				ON CONFLICT (id) DO NOTHING
			`, a.ID, a.Title, a.Subtitle, a.Content, a.Category, a.Author, a.AuthorRole, a.PublishedDate,
				a.Edition, a.ReadTimeMinutes, a.CoverImageURL, a.Featured, a.IsPublished, a.Tags,
				nullIfEmptySeed(a.VendorName), nullJSON(a.ImpactHighlight), a.LikesCount)
			if err != nil {
				return fmt.Errorf("seed article %s: %w", a.ID, err)
			}
		}
	}

	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms_guides`).Scan(&n); err != nil {
		return err
	}
	if n == 0 {
		var guides []struct {
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
		}
		if err := json.Unmarshal(guidesJSON, &guides); err != nil {
			return fmt.Errorf("parse guides: %w", err)
		}
		for _, g := range guides {
			if !json.Valid(g.KeyTakeaways) {
				g.KeyTakeaways = []byte("[]")
			}
			_, err := pool.Exec(ctx, `
				INSERT INTO cms_guides (
					id, title, pillar, category, summary, content, key_takeaways,
					read_time_minutes, icon_name, target_audience, is_published
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
				ON CONFLICT (id) DO NOTHING
			`, g.ID, g.Title, g.Pillar, g.Category, g.Summary, g.Content, g.KeyTakeaways,
				g.ReadTimeMinutes, g.IconName, g.TargetAudience)
			if err != nil {
				return fmt.Errorf("seed guide %s: %w", g.ID, err)
			}
		}
	}

	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms_spotlights`).Scan(&n); err != nil {
		return err
	}
	if n == 0 {
		var spots []struct {
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
		if err := json.Unmarshal(spotlightsJSON, &spots); err != nil {
			return fmt.Errorf("parse spotlights: %w", err)
		}
		for _, s := range spots {
			_, err := pool.Exec(ctx, `
				INSERT INTO cms_spotlights (
					id, vendor_name, industry, location, maturity_level, badge_title,
					achievement_summary, metric_achieved, metric_label, quote, quote_person,
					facility_image_url, logo_url, is_published
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
				ON CONFLICT (id) DO NOTHING
			`, s.ID, s.VendorName, s.Industry, s.Location, s.MaturityLevel, s.BadgeTitle,
				s.AchievementSummary, s.MetricAchieved, s.MetricLabel, s.Quote, s.QuotePerson,
				s.FacilityImageURL, nullIfEmptySeed(s.LogoURL), s.IsPublished)
			if err != nil {
				return fmt.Errorf("seed spotlight %s: %w", s.ID, err)
			}
		}
	}
	return nil
}

func seedCoC(ctx context.Context, pool *pgxpool.Pool) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM coc_versions`).Scan(&n); err != nil {
		return fmt.Errorf("coc_versions: %w", err)
	}
	if n > 0 {
		return nil
	}
	var doc struct {
		Version string          `json:"version"`
		TitleID string          `json:"titleId"`
		TitleEN string          `json:"titleEn"`
		Clauses json.RawMessage `json:"clauses"`
	}
	if err := json.Unmarshal(cocJSON, &doc); err != nil {
		return fmt.Errorf("parse coc: %w", err)
	}
	_, err := pool.Exec(ctx, `
		INSERT INTO coc_versions (version, title_id, title_en, clauses, is_current)
		VALUES ($1,$2,$3,$4,true) ON CONFLICT (version) DO NOTHING
	`, doc.Version, doc.TitleID, doc.TitleEN, doc.Clauses)
	return err
}

func seedQuestions(ctx context.Context, pool *pgxpool.Pool) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM assessment_questions`).Scan(&n); err != nil {
		return fmt.Errorf("assessment_questions: %w", err)
	}
	if n > 0 {
		return nil
	}
	var rows []struct {
		ID                string          `json:"id"`
		Pillar            string          `json:"pillar"`
		QuestionNumber    int             `json:"questionNumber"`
		QuestionText      string          `json:"questionText"`
		QuestionTextID    string          `json:"questionTextId"`
		WhyWeAsk          string          `json:"whyWeAsk"`
		WhyWeAskID        string          `json:"whyWeAskId"`
		Category          string          `json:"category"`
		CategoryID        string          `json:"categoryId"`
		LinkedActionIDs   json.RawMessage `json:"linkedActionIds"`
		LinkedModuleIDs   json.RawMessage `json:"linkedModuleIds"`
		RecommendedAction json.RawMessage `json:"recommendedAction"`
		RecommendedModule json.RawMessage `json:"recommendedModule"`
		IsActive          bool            `json:"isActive"`
	}
	if err := json.Unmarshal(questionsJSON, &rows); err != nil {
		return fmt.Errorf("parse questions: %w", err)
	}
	for _, q := range rows {
		if !json.Valid(q.LinkedActionIDs) {
			q.LinkedActionIDs = []byte("[]")
		}
		if !json.Valid(q.LinkedModuleIDs) {
			q.LinkedModuleIDs = []byte("[]")
		}
		_, err := pool.Exec(ctx, `
			INSERT INTO assessment_questions (
				id, pillar, question_number, question_text, question_text_id,
				why_we_ask, why_we_ask_id, category, category_id,
				linked_action_ids, linked_module_ids, recommended_action, recommended_module, is_active
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
			ON CONFLICT (id) DO NOTHING
		`, q.ID, q.Pillar, q.QuestionNumber, q.QuestionText, nullIfEmptySeed(q.QuestionTextID),
			q.WhyWeAsk, nullIfEmptySeed(q.WhyWeAskID), q.Category, nullIfEmptySeed(q.CategoryID),
			q.LinkedActionIDs, q.LinkedModuleIDs, nullJSON(q.RecommendedAction), nullJSON(q.RecommendedModule), q.IsActive)
		if err != nil {
			return fmt.Errorf("seed question %s: %w", q.ID, err)
		}
	}
	return nil
}

func seedCategories(ctx context.Context, pool *pgxpool.Pool) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM catalog_categories`).Scan(&n); err != nil {
		return fmt.Errorf("catalog_categories: %w", err)
	}
	if n > 0 {
		return nil
	}
	var rows []struct {
		ID                   string          `json:"id"`
		NameID               string          `json:"nameId"`
		NameEN               string          `json:"nameEn"`
		Pillar               string          `json:"pillar"`
		DefaultMetricUnitID  string          `json:"defaultMetricUnitId"`
		DefaultMetricUnitEN  string          `json:"defaultMetricUnitEn"`
		DefaultMetricLabelID string          `json:"defaultMetricLabelId"`
		DefaultMetricLabelEN string          `json:"defaultMetricLabelEn"`
		IconName             string          `json:"iconName"`
		SDGs                 json.RawMessage `json:"sdgs"`
		GRIStandards         json.RawMessage `json:"griStandards"`
		POJKCategory         string          `json:"pojkCategory"`
		ISOReference         string          `json:"isoReference"`
		DefaultTipsID        json.RawMessage `json:"defaultTipsId"`
		DefaultTipsEN        json.RawMessage `json:"defaultTipsEn"`
	}
	if err := json.Unmarshal(categoriesJSON, &rows); err != nil {
		return fmt.Errorf("parse categories: %w", err)
	}
	for i, r := range rows {
		if !json.Valid(r.SDGs) {
			r.SDGs = []byte("[]")
		}
		if !json.Valid(r.GRIStandards) {
			r.GRIStandards = []byte("[]")
		}
		if !json.Valid(r.DefaultTipsID) {
			r.DefaultTipsID = []byte("[]")
		}
		if !json.Valid(r.DefaultTipsEN) {
			r.DefaultTipsEN = []byte("[]")
		}
		_, err := pool.Exec(ctx, `
			INSERT INTO catalog_categories (
				id, name_id, name_en, pillar,
				default_metric_unit_id, default_metric_unit_en,
				default_metric_label_id, default_metric_label_en,
				icon_name, sdgs, gri_standards, pojk_category, iso_reference,
				default_tips_id, default_tips_en, sort_order
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
			ON CONFLICT (id) DO NOTHING
		`, r.ID, r.NameID, r.NameEN, r.Pillar,
			r.DefaultMetricUnitID, r.DefaultMetricUnitEN,
			r.DefaultMetricLabelID, r.DefaultMetricLabelEN,
			r.IconName, r.SDGs, r.GRIStandards, r.POJKCategory, nullIfEmptySeed(r.ISOReference),
			r.DefaultTipsID, r.DefaultTipsEN, i)
		if err != nil {
			return fmt.Errorf("seed category %s: %w", r.ID, err)
		}
	}
	return nil
}

func nullIfEmptySeed(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

func nullJSON(b []byte) any {
	if len(b) == 0 || !json.Valid(b) {
		return nil
	}
	return b
}
