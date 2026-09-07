-- Phase 4 remainder: vendor score SoT, assessment question bank, report indexes.
-- SSO Siloam is not in this file (needs their IdP). Email stays in email_outbox until SMTP is configured.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esg_score real NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esg_maturity_level text NOT NULL DEFAULT 'Starter';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_esg_maturity_chk;
ALTER TABLE vendors ADD CONSTRAINT vendors_esg_maturity_chk
  CHECK (esg_maturity_level IN ('Starter','Bronze','Silver','Gold','Champion'));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_esg_score_chk;
ALTER TABLE vendors ADD CONSTRAINT vendors_esg_score_chk
  CHECK (esg_score >= 0 AND esg_score <= 100);

CREATE INDEX IF NOT EXISTS vendors_maturity_idx ON vendors (esg_maturity_level, verification_status);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id text PRIMARY KEY,
  pillar text NOT NULL CHECK (pillar IN ('E','S','G')),
  question_number integer NOT NULL,
  question_text text NOT NULL,
  question_text_id text,
  why_we_ask text NOT NULL DEFAULT '',
  why_we_ask_id text,
  category text,
  category_id text,
  linked_action_ids jsonb NOT NULL DEFAULT '[]',
  linked_module_ids jsonb NOT NULL DEFAULT '[]',
  recommended_action jsonb,
  recommended_module jsonb,
  is_active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_questions_num_uidx
  ON assessment_questions (question_number);
CREATE INDEX IF NOT EXISTS assessment_questions_pillar_idx
  ON assessment_questions (pillar, question_number) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS assessment_results_vendor_completed_idx
  ON assessment_results (vendor_id, completed_at DESC NULLS LAST);

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON assessment_questions TO esg_together;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
