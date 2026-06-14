'use client';

import { StaggerContainer, Reveal } from '@/components/motion';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { CardC_Featured, CardC_Standard } from '@/components/project-card-variants';

type Project = typeof import('@/db/schema').projects.$inferSelect;

interface ProjectGridProps {
  projects: Project[];
  taskCountMap: Map<number, number>;
  wbsUnassignedMap: Map<number, number>;
  featuredProjectId: number | null;
}

export function ProjectGrid({ projects, taskCountMap, wbsUnassignedMap, featuredProjectId }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </div>
        <h2 className="text-lg font-semibold">No projects yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first project to start managing tasks, tracking progress, and organizing your work with PMBOK 8 process groups.
        </p>
        <CreateProjectDialog />
      </div>
    );
  }

  const featured = featuredProjectId != null
    ? projects.find((p) => p.id === featuredProjectId) ?? null
    : null;

  const rest = featured
    ? projects.filter((p) => p.id !== featured.id)
    : projects;

  return (
    <div className="flex flex-col gap-6">
      {featured && (
        <Reveal direction="up">
          <CardC_Featured
            project={featured}
            taskCount={taskCountMap.get(featured.id) ?? 0}
            wbsUnassigned={wbsUnassignedMap.get(featured.id) ?? 0}
            isFeatured
          />
        </Reveal>
      )}

      {rest.length > 0 && (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <CardC_Standard
              key={p.id}
              project={p}
              taskCount={taskCountMap.get(p.id) ?? 0}
              wbsUnassigned={wbsUnassignedMap.get(p.id) ?? 0}
              isFeatured={false}
            />
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
