-- Integrity pass: types, CHECKs, uniques, and indexes that match live queries.
--
-- ID policy (do not "upgrade" to uuid):
--   serial/bigserial  operational rows joined as WHERE vendor_id = $1 / WHERE id = $1
--                     (vendors, users, vendor_actions, assessments, impacts, evidence, logs)
--   text PK           catalog/CMS/learn/questions — public slugs in seed JSON, Excel, URLs
--                     (act_led_retrofit, mod_esg_101, q1, art_…). Validated in Go (catalogIDOK/cmsIDOK).
--   users.uid text    Firebase subject, UNIQUE, not the PK (FKs stay int).
-- UUID PK would randomize btree on the hot tenant indexes and break seed/Excel. Volume ceiling
-- is hundreds of vendors (PRD §2). Revisit UUID only if IDs are exposed across tenants without authz.

-- Naive timestamp columns from 001 → timestamptz (session stored as UTC).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'timestamp without time zone'
      AND column_name IN ('created_at','updated_at','completed_at','submitted_at','verified_at')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE %L',
      r.table_name, r.column_name, r.column_name, 'UTC'
    );
  END LOOP;
END $$;

UPDATE vendors SET verification_status = 'Pending' WHERE verification_status IS NULL;
ALTER TABLE vendors ALTER COLUMN verification_status SET DEFAULT 'Pending';
ALTER TABLE vendors ALTER COLUMN verification_status SET NOT NULL;
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_verification_chk;
ALTER TABLE vendors ADD CONSTRAINT vendors_verification_chk
  CHECK (verification_status IN ('Pending','Verified','Needs Review'));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_company_name_unique;
DROP INDEX IF EXISTS vendors_company_name_lower_idx;
CREATE UNIQUE INDEX IF NOT EXISTS vendors_company_name_lower_uidx ON vendors (lower(company_name));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_chk;
ALTER TABLE users ADD CONSTRAINT users_role_chk
  CHECK (role IN ('super_admin','admin','vendor_admin','vendor_member','vendor'));

DROP INDEX IF EXISTS users_email_lower_idx;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email));

ALTER TABLE vendor_actions DROP CONSTRAINT IF EXISTS vendor_actions_status_chk;
ALTER TABLE vendor_actions ADD CONSTRAINT vendor_actions_status_chk
  CHECK (status IN ('Not Started','In Progress','Submitted','Verified','Needs Info'));
ALTER TABLE vendor_actions DROP CONSTRAINT IF EXISTS vendor_actions_pillar_chk;
ALTER TABLE vendor_actions ADD CONSTRAINT vendor_actions_pillar_chk
  CHECK (pillar IN ('E','S','G'));

ALTER TABLE action_catalog DROP CONSTRAINT IF EXISTS action_catalog_difficulty_chk;
ALTER TABLE action_catalog ADD CONSTRAINT action_catalog_difficulty_chk
  CHECK (difficulty IS NULL OR difficulty IN ('Starter','Moderate','Advanced'));
ALTER TABLE action_catalog DROP CONSTRAINT IF EXISTS action_catalog_evidence_chk;
ALTER TABLE action_catalog ADD CONSTRAINT action_catalog_evidence_chk
  CHECK (required_evidence_type IN ('photo','document','both'));

ALTER TABLE learning_modules DROP CONSTRAINT IF EXISTS learning_modules_status_chk;
ALTER TABLE learning_modules ADD CONSTRAINT learning_modules_status_chk
  CHECK (status IN ('published','draft'));

-- No FK vendor_actions.action_id → action_catalog: upsertAction allows vendor-local action ids.
DO $$ BEGIN
  ALTER TABLE learning_progress
    ADD CONSTRAINT learning_progress_module_fk
    FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS coc_declarations_vendor_active_uidx
  ON coc_declarations (vendor_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS email_outbox_created_idx ON email_outbox (created_at DESC);
CREATE INDEX IF NOT EXISTS evidence_files_vendor_idx ON evidence_files (vendor_id);
CREATE INDEX IF NOT EXISTS ai_logs_vendor_idx ON ai_logs (vendor_id, created_at DESC);

DO $$ BEGIN
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO esg_together;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
