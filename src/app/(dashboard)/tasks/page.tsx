import { redirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks } from '@/db/schema';
import { TasksClient } from '@/components/tasks-client';

export default async function TasksPage() {
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

  const userProjects = await db
    .select({ id: projects.id, name: projects.name, status: projects.status })
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.name);

  const projectIds = userProjects.map((p) => p.id);

  let allTasks: (typeof tasks.$inferSelect & { projectName: string })[] = [];
  if (projectIds.length > 0) {
    const raw = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        completedDate: tasks.completedDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        estimatedCost: tasks.estimatedCost,
        actualCost: tasks.actualCost,
        percentComplete: tasks.percentComplete,
        wbsCode: tasks.wbsCode,
        predecessorId: tasks.predecessorId,
        orderIndex: tasks.orderIndex,
        parentId: tasks.parentId,
        wbsElementId: tasks.wbsElementId,
        startDate: tasks.startDate,
        checklistItems: tasks.checklistItems,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(inArray(tasks.projectId, projectIds))
      .orderBy(tasks.createdAt);

    allTasks = raw;
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <TasksClient
        allTasks={allTasks}
        projects={userProjects}
      />
    </>
  );
}
