'use client';

import { StaggerContainer, Reveal } from '@/components/motion';
import { ProjectCard } from '@/components/project-card';
import { CreateProjectDialog } from '@/components/create-project-dialog';

type Project = typeof import('@/db/schema').projects.$inferSelect;

interface ProjectGridProps {
  projects: Project[];
  taskCountMap: Map<number, number>;
}

export function ProjectGrid({ projects, taskCountMap }: ProjectGridProps) {
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

  const [featured, ...rest] = projects;

  return (
    <div className="flex flex-col gap-6">
      {/* ── FEATURED CARD ────────────────────────────────────────────────────
          First project breaks out of the equal-width grid: full-width,
          horizontal layout, progress stat right-anchored. This is the
          asymmetric element required per skill rules — one element per
          page that does not conform to the surrounding grid structure.
      ──────────────────────────────────────────────────────────────────── */}
      <Reveal direction="up">
        <ProjectCard
          project={featured}
          taskCount={taskCountMap.get(featured.id) ?? 0}
          isFeatured
        />
      </Reveal>

      {/* ── STANDARD GRID ────────────────────────────────────────────────────
          Remaining projects in 3-col staggered grid. Different layout
          from the featured card above — these are compact vertical cards,
          establishing a clear hierarchy: featured → secondary.
      ──────────────────────────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent -mx-0" />
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={taskCountMap.get(project.id) ?? 0}
              />
            ))}
          </StaggerContainer>
        </>
      )}
    </div>
  );
}
