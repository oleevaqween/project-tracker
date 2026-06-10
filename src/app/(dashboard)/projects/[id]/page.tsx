import { redirect, notFound } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks, notes, stakeholders, risks, changeRequests, lessonsLearned, issues } from '@/db/schema';
import { ProjectDetailClient } from '@/components/project-detail-client';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

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

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  if (!project) notFound();

  // Legacy projects don't use PMBOK data — skip the heavy queries
  let projectTasks: (typeof tasks.$inferSelect)[] = [];
  let projectNotes: (typeof notes.$inferSelect)[] = [];
  let projectStakeholders: (typeof stakeholders.$inferSelect)[] = [];
  let projectRisks: (typeof risks.$inferSelect)[] = [];
  let projectChangeRequests: (typeof changeRequests.$inferSelect)[] = [];
  let projectLessonsLearned: (typeof lessonsLearned.$inferSelect)[] = [];
  let projectIssues: (typeof issues.$inferSelect)[] = [];

  if (!project.isLegacy) {
    [projectTasks, projectNotes, projectStakeholders, projectRisks, projectChangeRequests, projectLessonsLearned, projectIssues] =
      await Promise.all([
        db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(tasks.orderIndex),
        db.select().from(notes).where(eq(notes.projectId, id)),
        db.select().from(stakeholders).where(eq(stakeholders.projectId, id)),
        db.select().from(risks).where(eq(risks.projectId, id)),
        db.select().from(changeRequests).where(eq(changeRequests.projectId, id)),
        db.select().from(lessonsLearned).where(eq(lessonsLearned.projectId, id)),
        db.select().from(issues).where(eq(issues.projectId, id)).orderBy(issues.createdAt),
      ]);
  }

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
              <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <ProjectDetailClient project={project} initialTasks={projectTasks} initialNotes={projectNotes} initialStakeholders={projectStakeholders} initialRisks={projectRisks} initialChangeRequests={projectChangeRequests} initialLessonsLearned={projectLessonsLearned} initialIssues={projectIssues} />
    </>
  );
}