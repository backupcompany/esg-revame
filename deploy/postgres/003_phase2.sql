-- Phase 2: catalog, evidence, proposals, learning modules, invite outbox.
-- Closed loop: commit action → upload proof → admin audit.

ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS quantity_reported real DEFAULT 1;
ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS ai_verification_score real;
ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS verification_feedback text;
ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS verified_by text;
ALTER TABLE vendor_actions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS vendor_actions_status_submitted_idx
  ON vendor_actions (status, submitted_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS action_catalog (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_id text,
  description text NOT NULL DEFAULT '',
  description_id text,
  pillar text NOT NULL CHECK (pillar IN ('E','S','G')),
  category text,
  category_id text,
  difficulty text,
  estimated_days integer DEFAULT 7,
  impact_metric_unit text,
  impact_metric_unit_id text,
  impact_metric_label text,
  impact_metric_label_id text,
  default_metric_name text,
  impact_multiplier real DEFAULT 0,
  icon_name text,
  image_url text,
  practical_tips jsonb NOT NULL DEFAULT '[]',
  practical_tips_id jsonb NOT NULL DEFAULT '[]',
  required_evidence_type text NOT NULL DEFAULT 'photo',
  points integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_catalog_pillar_active_idx ON action_catalog (pillar, is_active);
CREATE INDEX IF NOT EXISTS action_catalog_title_lower_idx ON action_catalog (lower(title));

CREATE TABLE IF NOT EXISTS proposed_actions (
  id serial PRIMARY KEY,
  vendor_id integer NOT NULL REFERENCES vendors(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  pillar text NOT NULL CHECK (pillar IN ('E','S','G')),
  category text,
  difficulty text,
  estimated_days integer,
  rationale text,
  proposed_by_email text,
  proposed_by_name text,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected','Needs Revision')),
  admin_feedback text,
  approved_action_id text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by integer REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS proposed_actions_vendor_idx ON proposed_actions (vendor_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS proposed_actions_status_idx ON proposed_actions (status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS evidence_files (
  id bigserial PRIMARY KEY,
  vendor_action_id integer NOT NULL REFERENCES vendor_actions(id) ON DELETE CASCADE,
  vendor_id integer NOT NULL REFERENCES vendors(id),
  uploaded_by integer REFERENCES users(id),
  file_name text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  file_type text NOT NULL CHECK (file_type IN ('image','document')),
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidence_files_action_idx ON evidence_files (vendor_action_id);

CREATE TABLE IF NOT EXISTS learning_modules (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_id text,
  description text NOT NULL DEFAULT '',
  description_id text,
  pillar text NOT NULL CHECK (pillar IN ('E','S','G')),
  duration_minutes integer DEFAULT 0,
  points integer DEFAULT 0,
  badge_icon text,
  cover_image_url text,
  industry_sector text,
  difficulty text,
  linked_action_ids jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'published',
  lessons jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_modules_status_idx ON learning_modules (status, pillar);

CREATE TABLE IF NOT EXISTS email_outbox (
  id serial PRIMARY KEY,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL,
  vendor_id integer REFERENCES vendors(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_outbox_status_idx ON email_outbox (status, created_at);

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON
    action_catalog, proposed_actions, evidence_files, learning_modules, email_outbox
    TO esg_together;
  GRANT USAGE, SELECT ON SEQUENCE
    proposed_actions_id_seq, evidence_files_id_seq, email_outbox_id_seq
    TO esg_together;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
