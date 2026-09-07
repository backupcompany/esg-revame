-- PRD §6.4 catalog ↔ learn/assessment links (was only in seed JSON).
ALTER TABLE action_catalog ADD COLUMN IF NOT EXISTS linked_module_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE action_catalog ADD COLUMN IF NOT EXISTS related_assessment_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
