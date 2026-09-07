package api

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"esg-together/backend/internal/authn"
	"esg-together/backend/internal/config"
	"esg-together/backend/internal/httpx"
)

type Server struct {
	cfg          config.Config
	db           *pgxpool.Pool
	auth         *authn.Verifier
	pubLimit     *limiter
	aiLimit      *limiter
	demoPassHash []byte
}

type ctxKey string

const principalKey ctxKey = "principal"

type dbUser struct {
	ID       int
	UID      string
	Email    string
	Name     string
	Role     string
	VendorID *int
}

func New(cfg config.Config, pool *pgxpool.Pool) http.Handler {
	gin.SetMode(gin.ReleaseMode)
	s := &Server{cfg: cfg, db: pool, auth: authn.NewVerifier(cfg), pubLimit: newLimiter(), aiLimit: newLimiter()}
	if cfg.AllowDemo && cfg.TestPassword != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(cfg.TestPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("demo password hash: %v", err)
		} else {
			s.demoPassHash = hash
		}
	}
	r := gin.New()
	_ = r.SetTrustedProxies(nil)
	r.Use(gin.CustomRecovery(func(c *gin.Context, rec any) {
		log.Printf("panic: %v", rec)
		httpx.Error(c.Writer, http.StatusInternalServerError, "internal error")
	}))
	r.Use(s.securityHeaders)
	r.Use(s.denyPlainHTTP)
	r.MaxMultipartMemory = 12 << 20

	r.GET("/api/health", s.health)

	pub := r.Group("/api/public")
	pub.Use(s.limitPublic(60))
	{
		pub.GET("/hero", s.publicHero)
		pub.GET("/articles", s.publicArticles)
		pub.GET("/articles/:id", s.publicArticle)
		pub.POST("/articles/:id/like", s.limitPublic(10), s.likeArticle)
		pub.GET("/gallery", s.publicGallery)
		pub.GET("/guides", s.publicGuides)
		pub.GET("/guides/:id", s.publicGuide)
		pub.GET("/spotlights", s.publicSpotlights)
		pub.GET("/metrics", s.publicMetrics)
		pub.POST("/subscribe", s.limitPublic(5), s.subscribe)
		pub.POST("/auth/login", s.limitPublic(5), s.demoPasswordLogin)
		pub.POST("/auth/demo-admin", s.limitPublic(5), s.demoAdminEnter)
		pub.POST("/auth/logout", s.limitPublic(20), s.logout)
		pub.GET("/coc", s.currentCoC)
	}

	authed := r.Group("/api")
	authed.Use(s.requireAuth)
	{
		authed.GET("/auth/me", s.me)
		authed.POST("/auth/preferences", s.setPreferences)
		authed.GET("/vendors", s.getVendors)
		authed.POST("/vendors", s.upsertVendor)

		authed.GET("/admin/corporate-grid", s.corporateGrid)
		authed.GET("/admin/vendors", s.adminVendors)
		authed.POST("/admin/vendors/excel-upload", s.excelUpload)
		authed.POST("/admin/vendors/:id/verify", s.verifyVendor)
		authed.POST("/admin/users/:id/role", s.updateUserRole)
		authed.GET("/admin/overview", s.adminOverview)
		authed.GET("/admin/audit-queue", s.auditQueue)
		authed.POST("/admin/audit/:id", s.reviewCommitment)
		authed.POST("/admin/catalog/actions", s.upsertCatalogAction)
		authed.DELETE("/admin/catalog/actions/:id", s.deleteCatalogAction)
		authed.POST("/admin/proposals/:id/review", s.reviewProposal)
		authed.POST("/admin/learn/modules", s.upsertLearnModule)
		authed.DELETE("/admin/learn/modules/:id", s.deleteLearnModule)
		authed.GET("/admin/cms/hero", s.adminHeroList)
		authed.POST("/admin/cms/hero", s.upsertHero)
		authed.DELETE("/admin/cms/hero/:id", s.deleteHero)
		authed.GET("/admin/cms/articles", s.adminArticles)
		authed.GET("/admin/cms/articles/:id", s.adminArticle)
		authed.POST("/admin/cms/articles", s.upsertArticle)
		authed.DELETE("/admin/cms/articles/:id", s.deleteArticle)
		authed.GET("/admin/cms/gallery", s.adminGallery)
		authed.POST("/admin/cms/gallery", s.upsertGallery)
		authed.DELETE("/admin/cms/gallery/:id", s.deleteGallery)
		authed.GET("/admin/cms/guides", s.adminGuides)
		authed.GET("/admin/cms/guides/:id", s.adminGuide)
		authed.POST("/admin/cms/guides", s.upsertGuide)
		authed.DELETE("/admin/cms/guides/:id", s.deleteGuide)
		authed.GET("/admin/cms/spotlights", s.adminSpotlights)
		authed.POST("/admin/cms/spotlights", s.upsertSpotlight)
		authed.DELETE("/admin/cms/spotlights/:id", s.deleteSpotlight)
		authed.GET("/admin/cms/subscribers", s.adminSubscribers)
		authed.POST("/admin/coc/versions", s.publishCoCVersion)

		authed.GET("/coc", s.currentCoC)
		authed.GET("/coc/declarations", s.listDeclarations)
		authed.POST("/coc/sign", s.signCoC)

		authed.GET("/ai/logs", s.listAILogs)
		authed.POST("/ai/recommend-actions", s.limitAI, s.aiRecommend)
		authed.POST("/ai/verify-evidence", s.limitAI, s.aiVerifyEvidence)
		authed.POST("/ai/generate-report", s.limitAI, s.aiReport)
		authed.POST("/ai/generate-course", s.limitAI, s.aiGenerateCourse)
		authed.POST("/ai/match-or-create-actions", s.limitAI, s.aiMatchActions)

		authed.GET("/admin/email-outbox", s.adminOutbox)
		authed.GET("/admin/reports/vendors.csv", s.exportVendorsCSV)
		authed.GET("/reports/commitments.csv", s.exportCommitmentsCSV)

		authed.GET("/catalog/categories", s.listCatalogCategories)
		authed.GET("/catalog/actions", s.listCatalog)
		authed.GET("/catalog/actions/:id", s.getCatalogAction)
		authed.POST("/admin/catalog/actions/parse", s.parseCatalogExcel)

		authed.GET("/assessment/questions", s.listAssessmentQuestions)
		authed.GET("/assessments", s.listAssessments)
		authed.GET("/assessments/latest", s.latestAssessment)
		authed.POST("/assessments", s.createAssessment)

		authed.GET("/actions", s.listActions)
		authed.POST("/actions", s.upsertAction)
		authed.POST("/actions/commit", s.commitAction)
		authed.POST("/actions/:id/evidence", s.uploadEvidence)

		authed.GET("/evidence/:id", s.getEvidenceFile)

		authed.GET("/proposals", s.listProposals)
		authed.POST("/proposals", s.createProposal)

		authed.GET("/impacts", s.listImpacts)
		authed.GET("/impacts/summary", s.impactSummary)
		authed.POST("/impacts", s.createImpact)

		authed.GET("/learn/modules", s.listLearnModules)
		authed.GET("/learn/modules/:id", s.getLearnModule)
		authed.GET("/learning", s.listLearning)
		authed.POST("/learning", s.upsertLearning)
	}

	return r
}

func (s *Server) health(c *gin.Context) {
	ctx := c.Request.Context()
	if err := s.db.Ping(ctx); err != nil {
		httpx.JSON(c.Writer, http.StatusServiceUnavailable, gin.H{"status": "degraded", "app": "ESG Together"})
		return
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"status": "ok", "app": "ESG Together"})
}

func (s *Server) requireAuth(c *gin.Context) {
	raw := bearerOrCookie(c)
	if raw == "" {
		httpx.Error(c.Writer, http.StatusUnauthorized, "Unauthorized: Missing token")
		c.Abort()
		return
	}
	p, err := s.auth.Verify(c.Request.Context(), raw)
	if err != nil {
		httpx.Error(c.Writer, http.StatusUnauthorized, "Unauthorized: Invalid token")
		c.Abort()
		return
	}
	c.Set(string(principalKey), p)
	c.Next()
}

func principal(c *gin.Context) authn.Principal {
	v, _ := c.Get(string(principalKey))
	p, _ := v.(authn.Principal)
	return p
}

func (s *Server) loadUser(ctx context.Context, uid string) (*dbUser, error) {
	var u dbUser
	err := s.db.QueryRow(ctx, `
		SELECT id, uid, email, COALESCE(name,''), COALESCE(role,'vendor_member'), vendor_id
		FROM users WHERE uid = $1
	`, uid).Scan(&u.ID, &u.UID, &u.Email, &u.Name, &u.Role, &u.VendorID)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func likeContains(q string) string {
	q = strings.ReplaceAll(q, `\`, `\\`)
	q = strings.ReplaceAll(q, `%`, `\%`)
	q = strings.ReplaceAll(q, `_`, `\_`)
	return "%" + q + "%"
}
