CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"impact" varchar(20) DEFAULT 'medium',
	"owner" varchar(255),
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"resolved_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(30) DEFAULT 'amber',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
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
--> statement-breakpoint
CREATE TABLE "project_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"project_id" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "portfolio_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "program_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "currency" varchar(3) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_spent" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "baseline_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "baseline_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "quality_metrics" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_legacy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "legacy_summary" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "charter" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_hours" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "percent_complete" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reports" ADD CONSTRAINT "project_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;