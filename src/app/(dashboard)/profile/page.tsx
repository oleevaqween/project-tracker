import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { ProfileClient } from '@/components/profile-client';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  const provider = (user.app_metadata?.provider as string) ?? 'email';

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <div className="flex flex-1 flex-col gap-8 px-6 pt-8 pb-12 md:px-12 lg:px-16 max-w-2xl">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
            ACCOUNT
          </p>
          <h1 className="text-[2.75rem] font-black font-heading tracking-[-0.025em] leading-[1.05] text-foreground">
            Profile
          </h1>
        </div>
        <ProfileClient
          profile={{
            username: profile.username,
            displayName: profile.displayName ?? '',
            bio: profile.bio ?? '',
            createdAt: profile.createdAt,
          }}
          email={user.email ?? ''}
          provider={provider}
        />
      </div>
    </>
  );
}
