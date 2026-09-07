-- Catalog taxonomy (SDG/GRI/POJK). Seed from backend/internal/seed/categories.json.

CREATE TABLE IF NOT EXISTS catalog_categories (
  id text PRIMARY KEY,
  name_id text NOT NULL,
  name_en text NOT NULL,
  pillar text NOT NULL,
  default_metric_unit_id text NOT NULL DEFAULT '',
  default_metric_unit_en text NOT NULL DEFAULT '',
  default_metric_label_id text NOT NULL DEFAULT '',
  default_metric_label_en text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Zap',
  sdgs jsonb NOT NULL DEFAULT '[]'::jsonb,
  gri_standards jsonb NOT NULL DEFAULT '[]'::jsonb,
  pojk_category text NOT NULL DEFAULT '',
  iso_reference text,
  default_tips_id jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_tips_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE catalog_categories DROP CONSTRAINT IF EXISTS catalog_categories_pillar_chk;
ALTER TABLE catalog_categories ADD CONSTRAINT catalog_categories_pillar_chk
  CHECK (pillar IN ('E', 'S', 'G'));

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_categories TO esg_together;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
