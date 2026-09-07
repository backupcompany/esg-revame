package api

import (
	"encoding/json"
	"math"
)

type scoreQ struct {
	ID        string
	Pillar    string
	RecAction json.RawMessage
	RecModule json.RawMessage
}

type scoreOut struct {
	Overall    int
	Level      string
	Earned     int
	Max        int
	Pillars    json.RawMessage
	RecActions json.RawMessage
	RecModules json.RawMessage
}

func scorePoints(ans string) (int, bool) {
	switch ans {
	case "yes":
		return 10, true
	case "partially":
		return 5, true
	case "not_yet":
		return 0, true
	default:
		return 0, false
	}
}

func maturityLevel(pct int) string {
	if pct >= 86 {
		return "Leader"
	}
	if pct >= 61 {
		return "Practitioner"
	}
	if pct >= 36 {
		return "Contributor"
	}
	return "Starter"
}

func recID(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var m map[string]any
	if json.Unmarshal(raw, &m) != nil {
		return ""
	}
	id, _ := m["id"].(string)
	if id != "" {
		return id
	}
	mid, _ := m["moduleId"].(string)
	return mid
}

func appendRec(dst []json.RawMessage, seen map[string]struct{}, raw json.RawMessage, limit int) []json.RawMessage {
	if len(dst) >= limit {
		return dst
	}
	id := recID(raw)
	if id == "" {
		return dst
	}
	if _, ok := seen[id]; ok {
		return dst
	}
	seen[id] = struct{}{}
	return append(dst, raw)
}

func pickRecs(qs []scoreQ, answers map[string]string, get func(scoreQ) json.RawMessage, defaults []string, limit int) []json.RawMessage {
	byID := map[string]scoreQ{}
	for _, q := range qs {
		byID[q.ID] = q
	}
	seen := map[string]struct{}{}
	out := make([]json.RawMessage, 0, limit)
	for _, want := range []string{"not_yet", "partially"} {
		for _, q := range qs {
			if answers[q.ID] == want {
				out = appendRec(out, seen, get(q), limit)
			}
		}
	}
	for _, id := range defaults {
		if len(out) >= limit {
			break
		}
		if q, ok := byID[id]; ok {
			out = appendRec(out, seen, get(q), limit)
		}
	}
	return out
}

func scoreAssessment(qs []scoreQ, answers map[string]string) scoreOut {
	type agg struct{ earned, max, count int }
	pillars := map[string]*agg{"E": {}, "S": {}, "G": {}}
	earned, max := 0, 0
	for _, q := range qs {
		pts, ok := scorePoints(answers[q.ID])
		if !ok {
			continue
		}
		p := pillars[q.Pillar]
		if p == nil {
			continue
		}
		p.count++
		p.earned += pts
		p.max += 10
		earned += pts
		max += 10
	}
	pct := 0
	if max > 0 {
		pct = int(math.Round(float64(earned) / float64(max) * 100))
	}
	titles := map[string][2]string{
		"E": {"Environmental", "Lingkungan (E)"},
		"S": {"Social", "Sosial & K3 (S)"},
		"G": {"Governance", "Tata Kelola (G)"},
	}
	pillarJSON := map[string]any{}
	for _, k := range []string{"E", "S", "G"} {
		a := pillars[k]
		ppct := 0
		if a.max > 0 {
			ppct = int(math.Round(float64(a.earned) / float64(a.max) * 100))
		}
		t := titles[k]
		pillarJSON[k] = map[string]any{
			"pillar": k, "title": t[0], "titleId": t[1],
			"earnedPoints": a.earned, "maxPoints": a.max,
			"percentage": ppct, "answeredCount": a.count,
		}
	}
	pj, _ := json.Marshal(pillarJSON)
	acts := pickRecs(qs, answers, func(q scoreQ) json.RawMessage { return q.RecAction }, []string{"q2", "q6", "q11"}, 4)
	mods := pickRecs(qs, answers, func(q scoreQ) json.RawMessage { return q.RecModule }, []string{"q1", "q6", "q11"}, 3)
	if acts == nil {
		acts = []json.RawMessage{}
	}
	if mods == nil {
		mods = []json.RawMessage{}
	}
	aj, _ := json.Marshal(acts)
	mj, _ := json.Marshal(mods)
	return scoreOut{
		Overall: pct, Level: maturityLevel(pct), Earned: earned, Max: max,
		Pillars: pj, RecActions: aj, RecModules: mj,
	}
}
