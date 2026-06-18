import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, portfolios, projects, tasks, risks } from '@/db/schema';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  // Redirect to onboarding if profile hasn't been created yet
  const [profile] = await db
    .select({ username: profiles.username, displayName: profiles.displayName })
    // username is fetched as fallback for the greeting when displayName is not set
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  // Fetch dashboard data — all queries in parallel for performance
  const [userPortfolios, userProjects, userTaskRows, userRisks] = await Promise.all([
    db.select().from(portfolios).where(eq(portfolios.userId, user.id)).orderBy(portfolios.createdAt),
    db.select().from(projects).where(eq(projects.userId, user.id)).orderBy(projects.updatedAt),
    db.select().from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, user.id)),
    db.select({ projectId: risks.projectId, status: risks.status, riskScore: risks.riskScore })
      .from(risks)
      .innerJoin(projects, eq(risks.projectId, projects.id))
      .where(eq(projects.userId, user.id)),
  ]);

  const userTasks = userTaskRows;

  // Compute stats
  const totalProjects = userProjects.length;
  const completedProjects = userProjects.filter((p) => p.status === 'completed').length;
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.tasks.status === 'done').length;
  const avgProgress = totalProjects > 0
    ? Math.round(userProjects.reduce((sum, p) => sum + (p.progressPercent ?? 0), 0) / totalProjects)
    : 0;

  // Per-portfolio breakdown — computed from already-fetched data (no extra DB queries)
  const portfolioBreakdown = userPortfolios.map((p) => {
    const pProjects = userProjects.filter((pr) => pr.portfolioId === p.id);
    const projectIds = new Set(pProjects.map((pr) => pr.id));
    const pTasks = userTasks.filter((t) => projectIds.has(t.tasks.projectId));
    const pRisks = userRisks.filter((r) => projectIds.has(r.projectId));
    const totalBudget = pProjects.reduce((s, pr) => s + Number(pr.budget ?? 0), 0);
    return {
      id: p.id,
      name: p.name,
      color: p.color ?? 'amber',
      projectCount: pProjects.length,
      avgProgress: pProjects.length > 0
        ? Math.round(pProjects.reduce((s, pr) => s + (pr.progressPercent ?? 0), 0) / pProjects.length)
        : 0,
      activeProjects: pProjects.filter((pr) => pr.status === 'active' || pr.status === 'in_progress' || pr.status === 'planning').length,
      completedProjects: pProjects.filter((pr) => pr.status === 'completed').length,
      taskDone: pTasks.filter((t) => t.tasks.status === 'done').length,
      taskTotal: pTasks.length,
      openRisks: pRisks.filter((r) => r.status !== 'closed').length,
      highRisks: pRisks.filter((r) => (r.riskScore ?? 0) >= 15 && r.status !== 'closed').length,
      totalBudget,
    };
  });
  const unassignedCount = userProjects.filter((p) => !p.portfolioId).length;

  // Aggregate per-principle averages from all projects' principlesReflection
  const principleKeys = ['holistic', 'value', 'quality', 'accountable', 'sustainability', 'empowered'] as const;
  const principlesAccum: Record<string, { sum: number; count: number }> = {};
  for (const project of userProjects) {
    const pr = project.principlesReflection as Record<string, number> | null;
    if (!pr) continue;
    for (const key of principleKeys) {
      const val = pr[key];
      if (val && val > 0) {
        if (!principlesAccum[key]) principlesAccum[key] = { sum: 0, count: 0 };
        principlesAccum[key].sum += val;
        principlesAccum[key].count += 1;
      }
    }
  }
  const principlesData: Record<string, { avg: number; count: number }> = {};
  for (const [key, { sum, count }] of Object.entries(principlesAccum)) {
    principlesData[key] = { avg: Math.round((sum / count) * 10) / 10, count };
  }

  // Status distribution for pie chart
  const statusCounts = Object.entries(
    userProjects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  // Compute weekly velocity (last 4 weeks)
  const now = new Date();
  const weeklyVelocity = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const completed = userTasks.filter((t) => {
      const d = t.tasks.completedDate;
      return d && new Date(d) >= weekStart && new Date(d) < weekEnd;
    }).length;

    const created = userTasks.filter((t) => {
      const d = t.tasks.createdAt;
      return new Date(d) >= weekStart && new Date(d) < weekEnd;
    }).length;

    return {
      week: `W${4 - i}`,
      completed,
      created,
    };
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <DashboardClient
        displayName={profile.displayName}
        username={profile.username}
        totalProjects={totalProjects}
        completedProjects={completedProjects}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        avgProgress={avgProgress}
        statusCounts={statusCounts}
        weeklyVelocity={weeklyVelocity}
        portfolioBreakdown={portfolioBreakdown}
        unassignedCount={unassignedCount}
        principlesData={principlesData}
      />
    </>
  );
}