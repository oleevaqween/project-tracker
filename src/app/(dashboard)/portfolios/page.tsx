import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, portfolios, projects, tasks, risks } from '@/db/schema';
import { PortfoliosClient } from '@/components/portfolios-client';

export default async function PortfoliosPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  const userPortfolios = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, user.id))
    .orderBy(portfolios.createdAt);

  // For each portfolio, get project count + aggregate stats
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id));

  const portfolioStats = userPortfolios.map((p) => {
    const pProjects = allProjects.filter((proj) => proj.portfolioId === p.id);
    return {
      ...p,
      projectCount: pProjects.length,
      avgProgress: pProjects.length > 0
        ? Math.round(pProjects.reduce((s, proj) => s + (proj.progressPercent ?? 0), 0) / pProjects.length)
        : 0,
    };
  });

  // Unassigned projects (no portfolio)
  const unassigned = allProjects.filter((p) => p.portfolioId === null);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <PortfoliosClient
        portfolios={portfolioStats}
        unassignedCount={unassigned.length}
      />
    </>
  );
}
