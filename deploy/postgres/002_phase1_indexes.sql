-- Phase 1: query performance + integrity (esg_together)
-- vendor_id / email lookups; prevent full-table scans on admin grid.

CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_vendor_id_idx ON users (vendor_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE INDEX IF NOT EXISTS vendors_verification_idx ON vendors (verification_status);
CREATE INDEX IF NOT EXISTS vendors_company_name_lower_idx ON vendors (lower(company_name));

CREATE INDEX IF NOT EXISTS vendor_allowed_emails_vendor_idx ON vendor_allowed_emails (vendor_id);

CREATE INDEX IF NOT EXISTS assessment_results_vendor_completed_idx
  ON assessment_results (vendor_id, completed_at DESC NULLS LAST);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_actions_vendor_action_uidx
  ON vendor_actions (vendor_id, action_id);
CREATE INDEX IF NOT EXISTS vendor_actions_vendor_status_idx
  ON vendor_actions (vendor_id, status);

CREATE INDEX IF NOT EXISTS impact_records_vendor_period_idx
  ON impact_records (vendor_id, period);

CREATE UNIQUE INDEX IF NOT EXISTS learning_progress_vendor_module_uidx
  ON learning_progress (vendor_id, module_id);
