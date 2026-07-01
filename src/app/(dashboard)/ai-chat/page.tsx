import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, chatSessions, projects } from '@/db/schema';
import { AiChatClient } from '@/components/ai-chat-client';
import type { AIConfig } from '@/lib/ai/models';

export default async function AiChatPage() {
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

  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, user.id))
    .orderBy(desc(chatSessions.updatedAt));

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id));

  const aiConfig = profile.aiConfig as AIConfig | null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <AiChatClient
        sessions={sessions}
        projects={userProjects}
        aiConfig={aiConfig}
        userId={user.id}
      />
    </>
  );
}