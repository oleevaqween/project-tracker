import { notFound } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';
import type { Metadata } from 'next';
import { db } from '@/db';
import { profiles, projects, tasks, risks } from '@/db/schema';
import { PublicPortfolioClient } from '@/components/public-portfolio-client';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const [profile] = await db
    .select({ displayName: profiles.displayName, bio: profiles.bio })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) return { title: 'Portfolio Not Found' };

  return {
    title: `${profile.displayName ?? username}'s Portfolio`,
    description: profile.bio ?? `Projects by ${profile.displayName ?? username}`,
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { username } = await params;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) notFound();

  const publicProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, profile.id), eq(projects.isPublic, true)))
    .orderBy(projects.updatedAt);

  const projectIds = publicProjects.map((p) => p.id);

  const [taskRows, riskRows] = projectIds.length > 0
    ? await Promise.all([
        db.select({ id: tasks.id, projectId: tasks.projectId, status: tasks.status })
          .from(tasks)
          .where(inArray(tasks.projectId, projectIds)),
        db.select({ id: risks.id, projectId: risks.projectId, riskScore: risks.riskScore })
          .from(risks)
          .where(inArray(risks.projectId, projectIds)),
      ])
    : [[], []];

  const tasksByProject = taskRows.reduce<Record<number, typeof taskRows>>((acc, t) => {
    (acc[t.projectId] ??= []).push(t);
    return acc;
  }, {});

  const risksByProject = riskRows.reduce<Record<number, typeof riskRows>>((acc, r) => {
    (acc[r.projectId] ??= []).push(r);
    return acc;
  }, {});

  return (
    <PublicPortfolioClient
      profile={profile}
      projects={publicProjects}
      tasksByProject={tasksByProject}
      risksByProject={risksByProject}
    />
  );
}
