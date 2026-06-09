import { redirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks, risks } from '@/db/schema';
import { AnalyticsClient } from '@/components/analytics-client';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  const [profile] = await db
    .select({ username: profiles.username, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  // Fetch all user projects with stats
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.updatedAt);

  // Fetch all tasks for the user's projects
  const projectIds = userProjects.map((p) => p.id);

  let allTasks: typeof tasks.$inferSelect[] = [];
  if (projectIds.length > 0) {
    allTasks = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));
  }

  // Fetch all risks
  let allRisks: typeof risks.$inferSelect[] = [];
  if (projectIds.length > 0) {
    allRisks = await db
      .select()
      .from(risks)
      .where(inArray(risks.projectId, projectIds));
  }

  // Compute analytics data
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Task status distribution
  const taskStatusDistribution = [
    { status: 'To Do', count: allTasks.filter((t) => t.status === 'todo').length, color: 'oklch(0.65 0.02 270)' },
    { status: 'In Progress', count: allTasks.filter((t) => t.status === 'in_progress').length, color: 'oklch(0.78 0.16 80)' },
    { status: 'Review', count: allTasks.filter((t) => t.status === 'review').length, color: 'oklch(0.75 0.15 50)' },
    { status: 'Done', count: allTasks.filter((t) => t.status === 'done').length, color: 'oklch(0.72 0.18 155)' },
  ];

  // Risk severity distribution
  const riskSeverity = [
    { level: 'Low (1-4)', count: allRisks.filter((r) => (r.probability ?? 1) * (r.impact ?? 1) <= 4).length, color: 'oklch(0.72 0.18 155)' },
    { level: 'Medium (5-9)', count: allRisks.filter((r) => { const s = (r.probability ?? 1) * (r.impact ?? 1); return s >= 5 && s <= 9; }).length, color: 'oklch(0.78 0.16 80)' },
    { level: 'High (10-16)', count: allRisks.filter((r) => { const s = (r.probability ?? 1) * (r.impact ?? 1); return s >= 10 && s <= 16; }).length, color: 'oklch(0.75 0.18 50)' },
    { level: 'Critical (17-25)', count: allRisks.filter((r) => (r.probability ?? 1) * (r.impact ?? 1) >= 17).length, color: 'oklch(0.65 0.25 25)' },
  ];

  // Focus area distribution
  const focusAreaDistribution = [
    { area: 'Initiating', count: userProjects.filter((p) => p.currentFocusArea === 'initiating').length },
    { area: 'Planning', count: userProjects.filter((p) => p.currentFocusArea === 'planning').length },
    { area: 'Executing', count: userProjects.filter((p) => p.currentFocusArea === 'executing').length },
    { area: 'Monitoring', count: userProjects.filter((p) => p.currentFocusArea === 'monitoring_controlling').length },
    { area: 'Closing', count: userProjects.filter((p) => p.currentFocusArea === 'closing').length },
  ];

  // Weekly velocity (last 8 weeks)
  const weeklyVelocity = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (7 - i - 1) * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const completed = allTasks.filter((t) => {
      const d = t.completedDate;
      return d && new Date(d) >= weekStart && new Date(d) < weekEnd;
    }).length;

    const created = allTasks.filter((t) => {
      const d = t.createdAt;
      return new Date(d) >= weekStart && new Date(d) < weekEnd;
    }).length;

    return {
      week: `W${i + 1}`,
      completed,
      created,
    };
  });

  // Project health summary
  const projectHealth = userProjects.map((p) => {
    const pTasks = allTasks.filter((t) => t.projectId === p.id);
    const pRisks = allRisks.filter((r) => r.projectId === p.id);
    const doneTasks = pTasks.filter((t) => t.status === 'done').length;
    const totalTasks = pTasks.length;
    const avgRiskScore = pRisks.length > 0
      ? pRisks.reduce((sum, r) => sum + (r.probability ?? 1) * (r.impact ?? 1), 0) / pRisks.length
      : 0;

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      focusArea: p.currentFocusArea,
      progressPercent: p.progressPercent ?? 0,
      totalTasks,
      doneTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      riskCount: pRisks.length,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
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
              <BreadcrumbPage>Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <AnalyticsClient
        totalProjects={userProjects.length}
        totalTasks={allTasks.length}
        totalRisks={allRisks.length}
        taskStatusDistribution={taskStatusDistribution}
        riskSeverity={riskSeverity}
        focusAreaDistribution={focusAreaDistribution}
        weeklyVelocity={weeklyVelocity}
        projectHealth={projectHealth}
      />
    </>
  );
}