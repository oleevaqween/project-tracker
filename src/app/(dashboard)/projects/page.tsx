import { redirect } from 'next/navigation';
import { eq, count } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks } from '@/db/schema';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { CreateLegacyProjectDialog } from '@/components/create-legacy-project-dialog';
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

      {/* ── PAGE HEADER BAND ─────────────────────────────────────────────────
          Full-bleed section with wider gutters than standard p-6.
          Asymmetric grid: title left, oversized count stat + actions right.
          The count stat creates a spatial anchor mirroring the dashboard's
          avg% stat — same retro-futurist typographic moment, different page.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="border-b px-6 pt-8 pb-6 md:px-12 lg:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              PORTFOLIO / PROJECTS
            </p>
            <h1 className="text-[2.75rem] font-black font-heading tracking-[-0.025em] leading-[1.05] text-foreground">
              Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {userProjects.length === 0
                ? 'Start your first project to begin PMBOK 8 tracking.'
                : `${userProjects.length} project${userProjects.length !== 1 ? 's' : ''} in your portfolio.`}
            </p>
          </div>

          {/* Right: editorial counter (desktop) + action buttons.
              TYPOGRAPHIC MOMENT — three-line stack: spaced caption / text-8xl
              zero-padded numeral / spaced caption. The 11px:96px:11px size
              ratio (1:8.7:1) creates maximum scale contrast on one element. */}
          <div className="flex items-end gap-8">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                TOTAL
              </p>
              <span className="block font-sans text-5xl font-black tracking-[-0.04em] text-primary leading-none tabular-nums">
                {String(userProjects.length).padStart(2, '0')}
              </span>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                PROJECTS
              </p>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <CreateLegacyProjectDialog />
              <CreateProjectDialog />
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ZONE ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-6 px-6 pt-8 pb-8 md:px-12 lg:px-16">
        <PMBOKGuide context="projects" />
        <ProjectGrid projects={userProjects} taskCountMap={taskCountMap} />
      </div>
    </>
  );
}