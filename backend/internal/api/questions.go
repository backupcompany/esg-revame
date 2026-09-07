package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func (s *Server) listAssessmentQuestions(c *gin.Context) {
	page := httpx.ParsePage(c.Request)
	if page.Limit > 30 {
		page.Limit = 30
	}
	ctx := c.Request.Context()
	var total int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM assessment_questions WHERE is_active = true`).Scan(&total)
	rows, err := s.db.Query(ctx, `
		SELECT id, pillar, question_number, question_text, COALESCE(question_text_id,''),
			why_we_ask, COALESCE(why_we_ask_id,''), COALESCE(category,''), COALESCE(category_id,''),
			linked_action_ids, linked_module_ids, recommended_action, recommended_module
		FROM assessment_questions WHERE is_active = true
		ORDER BY question_number
		LIMIT $1 OFFSET $2
	`, page.Limit, page.Offset)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	list := make([]gin.H, 0, page.Limit)
	for rows.Next() {
		var id, pillar, qEN, qID, whyEN, whyID, cat, catID string
		var num int
		var linkedA, linkedM, recA, recM []byte
		if rows.Scan(&id, &pillar, &num, &qEN, &qID, &whyEN, &whyID, &cat, &catID, &linkedA, &linkedM, &recA, &recM) != nil {
			continue
		}
		list = append(list, gin.H{
			"id": id, "pillar": pillar, "questionNumber": num,
			"questionText": qEN, "questionTextId": qID,
			"whyWeAsk": whyEN, "whyWeAskId": whyID,
			"category": cat, "categoryId": catID,
			"linkedActionIds": jsonRaw(linkedA), "linkedModuleIds": jsonRaw(linkedM),
			"recommendedAction": jsonObj(recA), "recommendedModule": jsonObj(recM),
		})
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{
		"questions": list, "total": total, "limit": page.Limit, "offset": page.Offset,
	})
}
