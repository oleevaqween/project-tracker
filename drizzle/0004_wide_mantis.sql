CREATE TABLE "wbs_elements" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"parent_id" integer,
	"wbs_code" varchar(30) DEFAULT '' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"responsible_party" varchar(255),
	"estimated_cost" numeric(12, 2),
	"dictionary_details" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "use_wbs" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "wbs_nudge_dismissed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "wbs_element_id" integer;--> statement-breakpoint
ALTER TABLE "wbs_elements" ADD CONSTRAINT "wbs_elements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wbs_elements" ADD CONSTRAINT "wbs_elements_parent_id_wbs_elements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wbs_elements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wbs_elements_project_idx" ON "wbs_elements" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_wbs_element_id_wbs_elements_id_fk" FOREIGN KEY ("wbs_element_id") REFERENCES "public"."wbs_elements"("id") ON DELETE set null ON UPDATE no action;