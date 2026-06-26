ALTER TABLE "projects" ADD COLUMN "planned_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "performance_domains" jsonb;