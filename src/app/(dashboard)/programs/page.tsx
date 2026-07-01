import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, programs, projects, portfolios } from '@/db/schema';
import { ProgramsClient } from '@/components/programs-client';

export default async function ProgramsPage() {
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

  const [userPrograms, userProjects, userPortfolios] = await Promise.all([
    db.select().from(programs).where(eq(programs.userId, user.id)).orderBy(programs.createdAt),
    db.select({ id: projects.id, name: projects.name, programId: projects.programId, progressPercent: projects.progressPercent, status: projects.status })
      .from(projects).where(eq(projects.userId, user.id)),
    db.select({ id: portfolios.id, name: portfolios.name }).from(portfolios).where(eq(portfolios.userId, user.id)),
  ]);

  const programsWithStats = userPrograms.map((p) => {
    const pProjects = userProjects.filter((pr) => pr.programId === p.id);
    return {
      ...p,
      projectCount: pProjects.length,
      avgProgress: pProjects.length > 0
        ? Math.round(pProjects.reduce((s, pr) => s + (pr.progressPercent ?? 0), 0) / pProjects.length)
        : 0,
      portfolioName: userPortfolios.find((pf) => pf.id === p.portfolioId)?.name ?? null,
    };
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <ProgramsClient
        programs={programsWithStats}
        portfolios={userPortfolios}
      />
    </>
  );
}
