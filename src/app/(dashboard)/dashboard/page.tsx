import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks } from '@/db/schema';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  // Redirect to onboarding if profile hasn't been created yet
  const [profile] = await db
    .select({ username: profiles.username, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) redirect('/onboarding');

  // Fetch dashboard data
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.updatedAt);

  const userTasks = await db
    .select()
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(projects.userId, user.id));

  // Compute stats
  const totalProjects = userProjects.length;
  const completedProjects = userProjects.filter((p) => p.status === 'completed').length;
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.tasks.status === 'done').length;
  const avgProgress = totalProjects > 0
    ? Math.round(userProjects.reduce((sum, p) => sum + (p.progressPercent ?? 0), 0) / totalProjects)
    : 0;

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
        totalProjects={totalProjects}
        completedProjects={completedProjects}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        avgProgress={avgProgress}
        statusCounts={statusCounts}
        weeklyVelocity={weeklyVelocity}
      />
    </>
  );
}