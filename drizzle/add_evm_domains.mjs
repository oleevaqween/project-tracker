import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "planned_value" numeric(12, 2)
  `);
  console.log('✓ planned_value column added');

  await client.query(`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "performance_domains" jsonb
  `);
  console.log('✓ performance_domains column added');

  console.log('\n✅ Migration complete!');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
