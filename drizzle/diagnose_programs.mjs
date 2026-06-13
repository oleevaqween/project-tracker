/**
 * Diagnostic: test programs table access and schema.
 * Run with: node drizzle/diagnose_programs.mjs
 * (DATABASE_URL must be set in env)
 */
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await client.connect();
console.log('Connected.\n');

try {
  // 1. Table existence
  const exists = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'programs'
  `);
  console.log('Table exists:', exists.rows.length > 0 ? '✅ YES' : '❌ NO');

  // 2. Column list
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programs'
    ORDER BY ordinal_position
  `);
  console.log('\nColumns:');
  cols.rows.forEach((c) => console.log(` ${c.column_name} — ${c.data_type} nullable=${c.is_nullable} default=${c.column_default}`));

  // 3. Row count
  const cnt = await client.query('SELECT count(*) FROM programs');
  console.log('\nRow count:', cnt.rows[0].count);

  // 4. Attempt the exact query the detail page runs
  const sel = await client.query(
    'SELECT id, user_id, portfolio_id, name, description, objectives, status, start_date, target_end_date, created_at, updated_at FROM programs LIMIT 5'
  );
  console.log('\nSample rows:', sel.rows);

  // 5. RLS check
  const rls = await client.query(`
    SELECT relrowsecurity FROM pg_class WHERE relname = 'programs'
  `);
  console.log('\nRLS enabled:', rls.rows[0]?.relrowsecurity ? '⚠️  YES (check policies)' : '✅ NO');

} catch (err) {
  console.error('\n❌ Error:', err.message);
  console.error('Code:', err.code);
  console.error('Detail:', err.detail);
} finally {
  await client.end();
}
