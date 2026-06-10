import { AppSidebar } from '@/components/app-sidebar';
import { TopBar } from '@/components/top-bar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  let username = '';
  if (session?.user) {
    const [profile] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);
    username = profile?.username ?? '';
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top-right user bar — sits over every page's header row */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-end px-4">
          <div className="pointer-events-auto">
            <TopBar username={username} />
          </div>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
