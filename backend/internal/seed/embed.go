package seed

import _ "embed"

//go:embed actions.json
var actionsJSON []byte

//go:embed modules.json
var modulesJSON []byte

//go:embed hero.json
var heroJSON []byte

//go:embed gallery.json
var galleryJSON []byte

//go:embed articles.json
var articlesJSON []byte

//go:embed guides.json
var guidesJSON []byte

//go:embed spotlights.json
var spotlightsJSON []byte

//go:embed coc.json
var cocJSON []byte

//go:embed questions.json
var questionsJSON []byte

//go:embed categories.json
var categoriesJSON []byte
