'use client';

import { StaggerContainer } from '@/components/motion';
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
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first project to start managing tasks, tracking progress, and organizing your work with PMBOK 8 process groups.
        </p>
        <CreateProjectDialog />
      </div>
    );
  }

  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          taskCount={taskCountMap.get(project.id) ?? 0}
        />
      ))}
    </StaggerContainer>
  );
}