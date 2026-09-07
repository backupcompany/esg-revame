package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func (s *Server) aiRecommend(c *gin.Context) {
	user, _ := s.loadUser(c.Request.Context(), principal(c).UID)
	var body struct {
		CurrentLevel  string `json:"currentLevel"`
		VendorProfile struct {
			Industry      string `json:"industry"`
			EmployeeCount string `json:"employeeCount"`
		} `json:"vendorProfile"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	fallback := gin.H{"recommendations": []gin.H{
		{"title": "LED Lighting & Smart Retrofit", "reason": "Immediate energy cost savings and low barrier installation.", "priority": "High"},
		{"title": "Digital Invoicing Transition", "reason": "Eliminates paper printing cost and speeds up billing cycles.", "priority": "High"},
		{"title": "Workplace Safety & First Aid Training", "reason": "Strengthens employee health & safety compliance rapidly.", "priority": "Medium"},
	}, "fallback": true}

	prompt := `You are an ESG advisor for hospital vendors. Industry: ` + jsonStr(clip(body.VendorProfile.Industry, 80)) +
		`. Employees: ` + jsonStr(clip(body.VendorProfile.EmployeeCount, 32)) +
		`. Maturity: ` + jsonStr(clip(body.CurrentLevel, 32)) +
		`. Suggest 3 practical low-barrier ESG actions. JSON: {"recommendations":[{"title":"","reason":"","priority":"High|Medium|Low"}]}`

	out, used := s.geminiJSON(c, prompt, fallback)
	s.logAI(c.Request.Context(), user, "recommendation", s.cfg.GeminiModel, used, gin.H{
		"industry": body.VendorProfile.Industry, "level": body.CurrentLevel,
	})
	httpx.JSON(c.Writer, http.StatusOK, out)
}

func (s *Server) aiVerifyEvidence(c *gin.Context) {
	user, _ := s.loadUser(c.Request.Context(), principal(c).UID)
	var body struct {
		ActionTitle string `json:"actionTitle"`
		Notes       string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	body.ActionTitle = clip(body.ActionTitle, 200)
	body.Notes = clip(body.Notes, 2000)
	fallback := gin.H{
		"status": "Pending", "confidenceScore": 0.5,
		"feedback": "Evidence notes received for \"" + body.ActionTitle + "\". Human auditor will complete verification.",
		"fallback": true,
	}
	prompt := `Review ESG evidence notes (no photo). Action: ` + jsonStr(body.ActionTitle) + `. Notes: ` + jsonStr(body.Notes) +
		`. Return JSON {"status":"Verified"|"Needs Information"|"Pending","confidenceScore":0-1,"feedback":"short"}`

	out, used := s.geminiJSON(c, prompt, fallback)
	s.logAI(c.Request.Context(), user, "evidence_verification", s.cfg.GeminiModel, used, gin.H{"actionTitle": body.ActionTitle})
	httpx.JSON(c.Writer, http.StatusOK, out)
}

func (s *Server) aiReport(c *gin.Context) {
	user, _ := s.loadUser(c.Request.Context(), principal(c).UID)
	var body struct {
		VendorName            string `json:"vendorName"`
		Level                 string `json:"level"`
		CompletedActionsCount int    `json:"completedActionsCount"`
		Impacts               gin.H  `json:"impacts"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	name := clip(body.VendorName, 120)
	level := clip(body.Level, 32)
	if body.CompletedActionsCount < 0 || body.CompletedActionsCount > 10000 {
		body.CompletedActionsCount = 0
	}
	fallback := gin.H{
		"summary": name + " completed ESG actions and is recognized at " + level + " maturity.",
		"keyHighlights": []string{
			"Documented operational sustainability actions.",
			"Workplace health, safety, and governance standards.",
			"Contribution to verified supply-chain impact metrics.",
		},
		"nextStepRecommendation": "Keep submitting evidence for committed actions and renew the Code of Conduct annually.",
		"fallback":               true,
	}
	imp, err := json.Marshal(body.Impacts)
	if err != nil || len(imp) > 2048 {
		imp = []byte("{}")
	}
	prompt := `Write a short executive ESG summary. Vendor: ` + jsonStr(name) + `. Level: ` + jsonStr(level) +
		`. Completed actions: ` + strconv.Itoa(body.CompletedActionsCount) +
		`. Impacts JSON: ` + string(imp) +
		`. Return JSON {"summary":"","keyHighlights":["","",""],"nextStepRecommendation":""}`
	out, used := s.geminiJSON(c, prompt, fallback)
	s.logAI(c.Request.Context(), user, "report_generation", s.cfg.GeminiModel, used, gin.H{"vendor": name})
	httpx.JSON(c.Writer, http.StatusOK, out)
}

func (s *Server) aiGenerateCourse(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		Topic    string `json:"topic"`
		Industry string `json:"industry"`
		Pillar   string `json:"pillar"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	topic := clip(body.Topic, 200)
	industry := clip(body.Industry, 80)
	pillar := clip(body.Pillar, 1)
	if _, ok := allowedPillar[pillar]; !ok {
		pillar = "E"
	}
	if topic == "" {
		httpx.Error(c.Writer, http.StatusBadRequest, "topic required")
		return
	}
	fallback := gin.H{"fallback": true}
	prompt := `Create a 4-lesson hospital-vendor ESG micro-course (PLANS). Topic: ` + jsonStr(topic) +
		`. Industry: ` + jsonStr(industry) + `. Pillar: ` + jsonStr(pillar) +
		`. Return JSON {"title":"","titleId":"","description":"","descriptionId":"","pillar":"E|S|G","durationMinutes":4,"points":80,"lessons":[{"id":"bite_1","title":"","textContent":"2-4 sentences","example":"1 sentence","quiz":{"question":"","options":["","","",""],"correctAnswerIndex":0,"explanation":""}}]} with exactly 4 lessons.`
	out, used := s.geminiJSON(c, prompt, fallback)
	s.logAI(c.Request.Context(), user, "chat", s.cfg.GeminiModel, used, gin.H{"topic": topic, "pillar": pillar})
	httpx.JSON(c.Writer, http.StatusOK, out)
}

func (s *Server) aiMatchActions(c *gin.Context) {
	user, ok := s.requireSuper(c)
	if !ok {
		return
	}
	var body struct {
		Topic    string `json:"topic"`
		Industry string `json:"industry"`
		Pillar   string `json:"pillar"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "invalid json")
		return
	}
	topic := clip(body.Topic, 200)
	industry := clip(body.Industry, 80)
	pillar := clip(body.Pillar, 1)
	fallback := gin.H{
		"fallback": true, "matchedExistingActionIds": []string{}, "suggestedNewActions": []any{},
		"matchReasoning": "AI unavailable.",
	}
	if topic == "" {
		httpx.JSON(c.Writer, http.StatusOK, fallback)
		return
	}
	ctx := c.Request.Context()
	q := `SELECT id, title FROM action_catalog WHERE is_active = true`
	args := []any{}
	if _, ok := allowedPillar[pillar]; ok {
		q += ` AND pillar = $1`
		args = append(args, pillar)
	}
	q += ` ORDER BY id LIMIT 40`
	rows, err := s.db.Query(ctx, q, args...)
	type catRow struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}
	catalog := make([]catRow, 0, 40)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var row catRow
			if rows.Scan(&row.ID, &row.Title) != nil {
				continue
			}
			catalog = append(catalog, row)
		}
	}
	catJSON, err := json.Marshal(catalog)
	if err != nil {
		catJSON = []byte("[]")
	}
	prompt := `Match this ESG course topic to existing catalog action ids. Topic: ` + jsonStr(topic) +
		`. Industry: ` + jsonStr(industry) + `. Catalog JSON: ` + string(catJSON) +
		`. Return JSON {"matchedExistingActionIds":["id"],"suggestedNewActions":[{"title":"","pillar":"E"}],"matchReasoning":"one sentence"}. Only use ids from catalog.`
	out, used := s.geminiJSON(c, prompt, fallback)
	s.logAI(ctx, user, "chat", s.cfg.GeminiModel, used, gin.H{"topic": topic})
	httpx.JSON(c.Writer, http.StatusOK, out)
}

func (s *Server) geminiJSON(c *gin.Context, prompt string, fallback gin.H) (gin.H, int) {
	key := strings.TrimSpace(s.cfg.GeminiAPIKey)
	base := strings.TrimSpace(s.cfg.GeminiGenerateURL)
	if key == "" || base == "" {
		return fallback, 0
	}
	reqBody, err := json.Marshal(map[string]any{
		"contents": []map[string]any{{
			"parts": []map[string]string{{"text": prompt}},
		}},
		"generationConfig": map[string]any{
			"responseMimeType": "application/json",
			"maxOutputTokens":  2048,
		},
	})
	if err != nil {
		return fallback, 0
	}
	ctx := c.Request.Context()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		base+key,
		bytes.NewReader(reqBody))
	if err != nil {
		return fallback, 0
	}
	req.Header.Set("Content-Type", "application/json")
	client := httpx.Outbound(15 * time.Second)
	res, err := client.Do(req)
	if err != nil {
		return fallback, 0
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 64<<10))
	if err != nil {
		return fallback, 0
	}
	if res.StatusCode >= 300 {
		return fallback, 0
	}
	var parsed struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		UsageMetadata struct {
			TotalTokenCount int `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}
	if json.Unmarshal(raw, &parsed) != nil || len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return fallback, 0
	}
	text := parsed.Candidates[0].Content.Parts[0].Text
	var obj gin.H
	if json.Unmarshal([]byte(text), &obj) != nil {
		return fallback, parsed.UsageMetadata.TotalTokenCount
	}
	return obj, parsed.UsageMetadata.TotalTokenCount
}

func clip(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) > n {
		return s[:n]
	}
	return s
}

func jsonStr(s string) string {
	b, err := json.Marshal(s)
	if err != nil {
		return `""`
	}
	return string(b)
}
