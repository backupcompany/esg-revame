package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"esg-together/backend/internal/httpx"
)

func (s *Server) adminOverview(c *gin.Context) {
	if _, ok := s.requireAdmin(c); !ok {
		return
	}
	ctx := c.Request.Context()
	var vendors, verifiedVendors, pendingAudit, verifiedActions int
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendors`).Scan(&vendors)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendors WHERE verification_status = 'Verified'`).Scan(&verifiedVendors)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendor_actions WHERE status = 'Submitted'`).Scan(&pendingAudit)
	_ = s.db.QueryRow(ctx, `SELECT COUNT(*) FROM vendor_actions WHERE status = 'Verified'`).Scan(&verifiedActions)

	totals := gin.H{
		"treesPlanted": 0, "peopleBenefited": 0, "employeesTrained": 0,
		"wasteRecycledKg": 0, "plasticReducedKg": 0, "paperReducedKg": 0,
		"energySavedKwh": 0, "renewableGeneratedKwh": 0, "waterSavedLiters": 0,
		"communityBeneficiaries": 0,
	}
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
			"pendingAudit":             pendingAudit,
			"totals":                   totals,
		},
		"vendorCount": vendors,
	})
}

func (s *Server) impactSummary(c *gin.Context) {
	vendorID, _, ok := s.vendorScope(c)
	if !ok {
		return
	}
	if vendorID == 0 {
		httpx.JSON(c.Writer, http.StatusOK, gin.H{"totals": emptyImpact()})
		return
	}
	totals := emptyImpact()
	rows, err := s.db.Query(c.Request.Context(), `
		SELECT ac.default_metric_name, SUM(COALESCE(va.quantity_reported,1) * COALESCE(ac.impact_multiplier,0))
		FROM vendor_actions va
		JOIN action_catalog ac ON ac.id = va.action_id
		WHERE va.vendor_id = $1 AND va.status = 'Verified'
		GROUP BY ac.default_metric_name
	`, vendorID)
	if err != nil {
		httpx.QueryFailed(c.Writer)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		var val float64
		if rows.Scan(&key, &val) != nil {
			continue
		}
		totals[key] = val
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"totals": totals})
}

func emptyImpact() gin.H {
	return gin.H{
		"treesPlanted": 0, "peopleBenefited": 0, "employeesTrained": 0,
		"wasteRecycledKg": 0, "plasticReducedKg": 0, "paperReducedKg": 0,
		"energySavedKwh": 0, "renewableGeneratedKwh": 0, "waterSavedLiters": 0,
		"communityBeneficiaries": 0,
	}
}
