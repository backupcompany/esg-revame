package api

import "testing"

func TestScoreAssessment(t *testing.T) {
	qs := []scoreQ{
		{ID: "q1", Pillar: "E", RecAction: []byte(`{"id":"a1"}`), RecModule: []byte(`{"id":"m1","moduleId":"mod1"}`)},
		{ID: "q2", Pillar: "E", RecAction: []byte(`{"id":"a2"}`), RecModule: []byte(`{"id":"m2","moduleId":"mod2"}`)},
		{ID: "q6", Pillar: "S", RecAction: []byte(`{"id":"a6"}`), RecModule: []byte(`{"id":"m6","moduleId":"mod6"}`)},
	}

	allYes := scoreAssessment(qs, map[string]string{"q1": "yes", "q2": "yes", "q6": "yes"})
	if allYes.Overall != 100 || allYes.Level != "Leader" || allYes.Earned != 30 {
		t.Fatalf("all yes: %+v", allYes)
	}

	mix := scoreAssessment(qs, map[string]string{"q1": "yes", "q2": "partially", "q6": "na"})
	if mix.Overall != 75 || mix.Level != "Practitioner" || mix.Max != 20 {
		t.Fatalf("mix skip na: %+v", mix)
	}

	gap := scoreAssessment(qs, map[string]string{"q1": "not_yet", "q2": "yes", "q6": "not_yet"})
	if gap.Overall != 33 || gap.Level != "Starter" {
		t.Fatalf("gap: %+v", gap)
	}

	blank := scoreAssessment(qs, map[string]string{"q1": "yes"})
	if blank.Overall != 33 || blank.Earned != 10 || blank.Max != 30 || blank.Level != "Starter" {
		t.Fatalf("blank counts as zero: %+v", blank)
	}
}
