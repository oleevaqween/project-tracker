import { redirect, notFound } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator, BreadcrumbLink,
} from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, programs, projects, tasks, risks, portfolios } from '@/db/schema';
import { ProgramDetailClient } from '@/components/program-detail-client';

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  let program: typeof programs.$inferSelect | undefined;
  try {
    [program] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.userId, user.id)))
      .limit(1);
  } catch (err) {
    // Log the real PostgreSQL error; visible in the Next.js dev console / Vercel logs
    console.error('[ProgramDetail] SELECT failed. Raw error:', err);
    console.error('[ProgramDetail] Error cause:', (err as { cause?: unknown }).cause);
    throw err;
  }

  if (!program) notFound();

  const programProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.programId, id), eq(projects.userId, user.id)))
    .orderBy(projects.updatedAt);

  const projectIds = programProjects.map((p) => p.id);

  let allTasks: typeof tasks.$inferSelect[] = [];
  let allRisks: typeof risks.$inferSelect[] = [];

  if (projectIds.length > 0) {
    [allTasks, allRisks] = await Promise.all([
      db.select().from(tasks).where(inArray(tasks.projectId, projectIds)),
      db.select().from(risks).where(inArray(risks.projectId, projectIds)),
    ]);
  }

  const portfolio = program.portfolioId
    ? (await db.select({ id: portfolios.id, name: portfolios.name })
        .from(portfolios)
        .where(eq(portfolios.id, program.portfolioId))
        .limit(1))[0] ?? null
    : null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/programs">Programs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{program.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <ProgramDetailClient
        program={program}
        projects={programProjects}
        tasks={allTasks}
        risks={allRisks}
        portfolio={portfolio}
      />
    </>
  );
}
