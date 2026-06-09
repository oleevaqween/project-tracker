/**
 * Seed script: Creates a test user and profile in Supabase.
 *
 * Run with: npx tsx src/scripts/seed-test-user.ts
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 * - Supabase Auth: make sure email confirmation is DISABLED for testing
 *   (Supabase Dashboard → Authentication → Settings → turn off "Enable email confirmations")
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const TEST_EMAIL = 'kuzipj69@gmail.com';
const TEST_PASSWORD = 'test123456'; // adjust if you used a different password
const TEST_USERNAME = 'kuzipj69';
const TEST_DISPLAY_NAME = 'Test User';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('🔧 Creating test user...');

  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    // If user already exists, try to sign in to get the ID
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      console.log('⚠️  User already exists, signing in to get ID...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (signInError) {
        console.error('❌ Failed to sign in:', signInError.message);
        process.exit(1);
      }
      await createProfile(supabase, signInData.user.id);
    } else {
      console.error('❌ Failed to create user:', authError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Auth user created:', authData.user?.id);
    if (authData.user) {
      await createProfile(supabase, authData.user.id);
    }
  }

  console.log('\n🎉 Test account ready!');
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`   Login at: http://localhost:3000/login`);
}

async function createProfile(supabase: ReturnType<typeof createClient>, userId: string) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (existing) {
    console.log('⚠️  Profile already exists for user:', userId);
    return;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username: TEST_USERNAME,
      display_name: TEST_DISPLAY_NAME,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('❌ Failed to create profile:', profileError.message);
  } else {
    console.log('✅ Profile created for user:', userId);
  }
}

main().catch(console.error);