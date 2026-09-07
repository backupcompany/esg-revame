-- Align identity + onboarding fields with PRD §6.1 / F2.
-- Do not add GCS/SSO/SMTP/PDF here.

UPDATE users SET role = 'vendor_member' WHERE role = 'vendor';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'vendor_member';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esg_familiarity text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esg_objectives jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_familiarity_chk;
ALTER TABLE vendors ADD CONSTRAINT vendors_familiarity_chk
  CHECK (
    esg_familiarity IS NULL OR esg_familiarity IN (
      'getting_started', 'several_activities', 'structured_programs', 'publish_reports'
    )
  );
