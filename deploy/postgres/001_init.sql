-- ESG Together — initial schema (matches src/db/schema.ts)
-- Applied on postgres-core (Siloam Tencent VPS)

CREATE TABLE IF NOT EXISTS "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"industry" text NOT NULL,
	"employee_count" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"address" text,
	"verification_status" text DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_company_name_unique" UNIQUE("company_name")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'vendor',
	"vendor_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);

CREATE TABLE IF NOT EXISTS "vendor_allowed_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assessment_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"user_id" integer,
	"overall_percentage" real NOT NULL,
	"maturity_level" text NOT NULL,
	"pillar_results" jsonb NOT NULL,
	"answers" jsonb NOT NULL,
	"recommended_actions" jsonb NOT NULL,
	"recommended_modules" jsonb NOT NULL,
	"assessment_count" integer DEFAULT 1,
	"completed_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vendor_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"action_id" text NOT NULL,
	"title" text NOT NULL,
	"pillar" text NOT NULL,
	"status" text DEFAULT 'Not Started',
	"evidence_file_url" text,
	"evidence_file_name" text,
	"submitted_at" timestamp,
	"verified_at" timestamp,
	"points" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "impact_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"metric_key" text NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"period" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "learning_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"user_id" integer,
	"module_id" text NOT NULL,
	"completed" boolean DEFAULT false,
	"quiz_score" integer,
	"completed_at" timestamp
);

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "vendor_allowed_emails" ADD CONSTRAINT "vendor_allowed_emails_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "vendor_actions" ADD CONSTRAINT "vendor_actions_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "impact_records" ADD CONSTRAINT "impact_records_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_vendor_id_vendors_id_fk"
 FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_allowed_emails_email_idx ON vendor_allowed_emails (lower(email));
