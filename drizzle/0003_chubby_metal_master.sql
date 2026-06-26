CREATE TABLE "user_preferences" (
	"user_id" varchar(36) PRIMARY KEY NOT NULL,
	"featured_project_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_featured_project_id_projects_id_fk" FOREIGN KEY ("featured_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;