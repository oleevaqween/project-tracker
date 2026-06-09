import { redirect, notFound } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, portfolios, projects, tasks, risks } from '@/db/schema';
import { PortfolioDetailClient } from '@/components/portfolio-detail-client';

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect('/login');

  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, user.id)))
    .limit(1);

  if (!portfolio) notFound();

  const portfolioProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.portfolioId, id), eq(projects.userId, user.id)))
    .orderBy(projects.updatedAt);

  const projectIds = portfolioProjects.map((p) => p.id);

  let allTasks: typeof tasks.$inferSelect[] = [];
  let allRisks: typeof risks.$inferSelect[] = [];

  if (projectIds.length > 0) {
    allTasks = await db.select().from(tasks).where(inArray(tasks.projectId, projectIds));
    allRisks = await db.select().from(risks).where(inArray(risks.projectId, projectIds));
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/portfolios">Portfolios</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{portfolio.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <PortfolioDetailClient
        portfolio={portfolio}
        projects={portfolioProjects}
        tasks={allTasks}
        risks={allRisks}
      />
    </>
  );
}
