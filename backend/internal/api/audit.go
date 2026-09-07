package api

import (
	"context"
	"encoding/json"
	"strconv"
)

func (s *Server) writeAudit(ctx context.Context, actorID int, action, entityType, entityID string, before, after any) {
	var b, a []byte
	if before != nil {
		var err error
		b, err = json.Marshal(before)
		if err != nil {
			b = nil
		}
	}
	if after != nil {
		var err error
		a, err = json.Marshal(after)
		if err != nil {
			a = nil
		}
	}
	_, _ = s.db.Exec(ctx, `
		INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, before, after)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, actorID, action, entityType, entityID, nullJSONBytes(b), nullJSONBytes(a))
}

func nullJSONBytes(b []byte) any {
	if len(b) == 0 {
		return nil
	}
	return b
}

func (s *Server) logAI(ctx context.Context, user *dbUser, actionType, model string, tokens int, meta any) {
	var vid any
	if user != nil && user.VendorID != nil {
		vid = *user.VendorID
	}
	var uid any
	if user != nil {
		uid = user.ID
	}
	raw, err := json.Marshal(meta)
	if err != nil || len(raw) > 8<<10 {
		raw = []byte(`{"truncated":true}`)
	}
	_, _ = s.db.Exec(ctx, `
		INSERT INTO ai_logs (user_id, vendor_id, model, action_type, tokens_used, request_meta)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, uid, vid, model, actionType, tokens, raw)
}

func idStr(n int) string { return strconv.Itoa(n) }
