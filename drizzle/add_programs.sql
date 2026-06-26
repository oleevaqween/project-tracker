CREATE TABLE IF NOT EXISTS "programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"portfolio_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"objectives" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"start_date" timestamp,
	"target_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "program_id" integer;

ALTER TABLE "programs" ADD CONSTRAINT IF NOT EXISTS "programs_portfolio_id_portfolios_id_fk"
	FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "projects" ADD CONSTRAINT IF NOT EXISTS "projects_program_id_programs_id_fk"
	FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
