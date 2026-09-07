-- Phase 3: public CMS, CoC versions, AI logs, admin audit trail, i18n preference.

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_lang text NOT NULL DEFAULT 'ID';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_preferred_lang_chk;
ALTER TABLE users ADD CONSTRAINT users_preferred_lang_chk
  CHECK (preferred_lang IN ('ID','EN'));

CREATE TABLE IF NOT EXISTS cms_hero_slides (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  badge_text text,
  category text NOT NULL,
  image_url text,
  overlay_gradient text NOT NULL DEFAULT 'emerald',
  impact_badge jsonb,
  cta_primary_text text,
  cta_primary_action text,
  target_article_id text,
  cta_secondary_text text,
  cta_secondary_action text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  updated_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_hero_pub_idx ON cms_hero_slides (is_published, sort_order);

CREATE TABLE IF NOT EXISTS cms_articles (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL,
  author text,
  author_role text,
  published_date text,
  edition text,
  read_time_minutes integer DEFAULT 3,
  cover_image_url text,
  featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  tags jsonb NOT NULL DEFAULT '[]',
  vendor_name text,
  impact_highlight jsonb,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  updated_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_articles_pub_idx ON cms_articles (is_published, featured, published_date DESC);
CREATE INDEX IF NOT EXISTS cms_articles_category_idx ON cms_articles (category, is_published);

CREATE TABLE IF NOT EXISTS cms_gallery (
  id text PRIMARY KEY,
  title text NOT NULL,
  hospital_unit text,
  category text NOT NULL,
  image_url text,
  caption text,
  year text,
  metric_tag text,
  is_published boolean NOT NULL DEFAULT false,
  updated_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_gallery_pub_idx ON cms_gallery (is_published, category);

CREATE TABLE IF NOT EXISTS cms_guides (
  id text PRIMARY KEY,
  title text NOT NULL,
  pillar text NOT NULL CHECK (pillar IN ('E','S','G','General')),
  category text,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  key_takeaways jsonb NOT NULL DEFAULT '[]',
  read_time_minutes integer DEFAULT 4,
  icon_name text,
  target_audience text,
  is_published boolean NOT NULL DEFAULT true,
  updated_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_guides_pub_idx ON cms_guides (is_published, pillar);

CREATE TABLE IF NOT EXISTS cms_spotlights (
  id text PRIMARY KEY,
  vendor_name text NOT NULL,
  industry text,
  location text,
  maturity_level text,
  badge_title text,
  achievement_summary text NOT NULL DEFAULT '',
  metric_achieved text,
  metric_label text,
  quote text,
  quote_person text,
  facility_image_url text,
  logo_url text,
  is_published boolean NOT NULL DEFAULT false,
  updated_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_spotlights_pub_idx ON cms_spotlights (is_published);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id serial PRIMARY KEY,
  email text NOT NULL,
  name text,
  organization text,
  consent_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_uidx
  ON newsletter_subscribers (lower(email));

CREATE TABLE IF NOT EXISTS coc_versions (
  version text PRIMARY KEY,
  title_id text NOT NULL,
  title_en text NOT NULL,
  clauses jsonb NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by integer REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS coc_versions_current_uidx
  ON coc_versions (is_current) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS coc_declarations (
  id serial PRIMARY KEY,
  vendor_id integer NOT NULL REFERENCES vendors(id),
  user_id integer REFERENCES users(id),
  vendor_name text NOT NULL,
  signer_name text NOT NULL,
  signer_title text NOT NULL,
  signer_address text NOT NULL,
  version text NOT NULL REFERENCES coc_versions(version),
  signature_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','pending_renewal')),
  declared_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS coc_declarations_vendor_idx
  ON coc_declarations (vendor_id, declared_at DESC);
CREATE INDEX IF NOT EXISTS coc_declarations_status_idx
  ON coc_declarations (status, valid_until);

CREATE TABLE IF NOT EXISTS ai_logs (
  id bigserial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  vendor_id integer REFERENCES vendors(id),
  model text NOT NULL,
  action_type text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  estimated_cost real NOT NULL DEFAULT 0,
  request_meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_logs_user_idx ON ai_logs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_user_id integer REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON
    cms_hero_slides, cms_articles, cms_gallery, cms_guides, cms_spotlights,
    newsletter_subscribers, coc_versions, coc_declarations, ai_logs, audit_log
    TO esg_together;
  GRANT USAGE, SELECT ON SEQUENCE
    newsletter_subscribers_id_seq, coc_declarations_id_seq, ai_logs_id_seq, audit_log_id_seq
    TO esg_together;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
