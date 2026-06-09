import { redirect } from 'next/navigation';
import { eq, count } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks } from '@/db/schema';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { ProjectGrid } from '@/components/project-grid';
import { PMBOKGuide } from '@/components/pmbok';

export default async function ProjectsPage() {
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

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.updatedAt);

  // Get task counts per project
  const taskCounts = await db
    .select({ projectId: tasks.projectId, count: count(tasks.id) })
    .from(tasks)
    .groupBy(tasks.projectId);

  const taskCountMap = new Map(taskCounts.map((t) => [t.projectId, t.count]));

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Projects
            </h1>
            <p className="text-sm text-muted-foreground/70 mt-0.5">
              {userProjects.length === 0
                ? 'Start your first project to begin PMBOK 8 tracking.'
                : `${userProjects.length} project${userProjects.length !== 1 ? 's' : ''} in your portfolio.`}
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        <PMBOKGuide context="projects" />

        <ProjectGrid projects={userProjects} taskCountMap={taskCountMap} />
      </div>
    </>
  );
}