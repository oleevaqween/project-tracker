import { redirect } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { AIConfig } from '@/lib/ai/models';
import { SettingsClient } from '@/components/settings-client';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  const aiConfig = profile.aiConfig as AIConfig | null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <SettingsClient
        aiConfig={aiConfig}
        username={profile.username}
      />
    </>
  );
}