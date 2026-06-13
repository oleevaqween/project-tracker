import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query(`
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
    )
  `);
  console.log('✓ programs table created (or already exists)');

  await client.query(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "program_id" integer
  `);
  console.log('✓ program_id column added to projects (or already exists)');

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'programs_portfolio_id_portfolios_id_fk'
      ) THEN
        ALTER TABLE "programs" ADD CONSTRAINT "programs_portfolio_id_portfolios_id_fk"
          FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null;
      END IF;
    END $$
  `);
  console.log('✓ programs → portfolios FK applied');

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_program_id_programs_id_fk'
      ) THEN
        ALTER TABLE "projects" ADD CONSTRAINT "projects_program_id_programs_id_fk"
          FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null;
      END IF;
    END $$
  `);
  console.log('✓ projects → programs FK applied');

  console.log('\n✅ Migration complete!');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
