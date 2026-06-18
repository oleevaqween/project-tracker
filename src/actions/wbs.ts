'use server';

import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { wbsElements, projects, tasks } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { buildWbsTree, assignWbsCodes, type WbsElement } from '@/lib/wbs-utils';

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export async function getWbsElements(projectId: number) {
  const user = await getAuthUser();
  return db
    .select()
    .from(wbsElements)
    .where(and(eq(wbsElements.projectId, projectId), eq(wbsElements.userId, user.id)))
    .orderBy(wbsElements.orderIndex);
}

export async function createWbsElement(data: {
  projectId: number;
  parentId: number | null;
  name: string;
  orderIndex: number;
}): Promise<{ id: number; wbsCode: string }> {
  const user = await getAuthUser();

  const [element] = await db
    .insert(wbsElements)
    .values({
      projectId: data.projectId,
      userId: user.id,
      parentId: data.parentId,
      name: data.name.trim(),
      wbsCode: '',
      orderIndex: data.orderIndex,
    })
    .returning();

  await recomputeAndSaveWbsCodes(data.projectId, user.id);

  const [updated] = await db
    .select({ id: wbsElements.id, wbsCode: wbsElements.wbsCode })
    .from(wbsElements)
    .where(eq(wbsElements.id, element.id));

  // Auto-create task (top-level) or checklist item (child)
  if (data.parentId === null) {
    const [maxOrder] = await db
      .select({ val: sql<number>`coalesce(max(${tasks.orderIndex}), -1) + 1` })
      .from(tasks)
      .where(eq(tasks.projectId, data.projectId));

    await db.insert(tasks).values({
      projectId: data.projectId,
      title: data.name.trim(),
      status: 'todo',
      priority: 'medium',
      wbsElementId: element.id,
      orderIndex: maxOrder?.val ?? 0,
    });
  } else {
    const [parentTask] = await db
      .select({ id: tasks.id, checklistItems: tasks.checklistItems })
      .from(tasks)
      .where(eq(tasks.wbsElementId, data.parentId));

    if (parentTask) {
      const existing = (parentTask.checklistItems ?? []) as { id: string; text: string; done: boolean }[];
      const newItem = { id: crypto.randomUUID(), text: data.name.trim(), done: false };
      await db.update(tasks)
        .set({ checklistItems: [...existing, newItem] })
        .where(eq(tasks.id, parentTask.id));
    }
  }

  revalidatePath(`/projects/${data.projectId}`);
  return { id: element.id, wbsCode: updated.wbsCode };
}

export async function updateWbsElement(
  id: number,
  data: Partial<{
    name: string;
    parentId: number | null;
    orderIndex: number;
    description: string | null;
    acceptanceCriteria: string | null;
    responsibleParty: string | null;
    estimatedCost: string | null;
    dictionaryDetails: {
      milestones?: string;
      resourcesRequired?: string;
      qualityRequirements?: string;
      assumptionsConstraints?: string;
    } | null;
  }>,
) {
  const user = await getAuthUser();

  const [element] = await db
    .select({ projectId: wbsElements.projectId })
    .from(wbsElements)
    .where(and(eq(wbsElements.id, id), eq(wbsElements.userId, user.id)));

  if (!element) return;

  await db.update(wbsElements).set({ ...data, updatedAt: new Date() }).where(eq(wbsElements.id, id));

  if (data.parentId !== undefined || data.orderIndex !== undefined) {
    await recomputeAndSaveWbsCodes(element.projectId, user.id);
  }

  revalidatePath(`/projects/${element.projectId}`);
}

export async function deleteWbsElement(id: number) {
  const user = await getAuthUser();

  const [toDelete] = await db
    .select({ projectId: wbsElements.projectId, parentId: wbsElements.parentId })
    .from(wbsElements)
    .where(and(eq(wbsElements.id, id), eq(wbsElements.userId, user.id)));

  if (!toDelete) return;

  // Re-parent direct children to this node's parent before deleting
  await db.update(wbsElements)
    .set({ parentId: toDelete.parentId ?? null })
    .where(eq(wbsElements.parentId, id));

  await db.delete(wbsElements).where(eq(wbsElements.id, id));
  await recomputeAndSaveWbsCodes(toDelete.projectId, user.id);
  revalidatePath(`/projects/${toDelete.projectId}`);
}

export async function setProjectWbsMode(projectId: number, useWbs: boolean) {
  const user = await getAuthUser();
  await db
    .update(projects)
    .set({ useWbs, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  revalidatePath(`/projects/${projectId}`);
}

export async function dismissWbsNudge(projectId: number) {
  const user = await getAuthUser();
  await db
    .update(projects)
    .set({ wbsNudgeDismissed: true, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  revalidatePath(`/projects/${projectId}`);
}

async function recomputeAndSaveWbsCodes(projectId: number, userId: string) {
  const all = await db
    .select()
    .from(wbsElements)
    .where(and(eq(wbsElements.projectId, projectId), eq(wbsElements.userId, userId)))
    .orderBy(wbsElements.orderIndex);

  const tree = buildWbsTree(all as WbsElement[]);
  assignWbsCodes(tree);

  const updates = flattenTree(tree);
  await Promise.all(
    updates.map(({ id, wbsCode }) =>
      db.update(wbsElements).set({ wbsCode }).where(eq(wbsElements.id, id))
    )
  );
}

function flattenTree(nodes: import('@/lib/wbs-utils').WbsNode[]): { id: number; wbsCode: string }[] {
  const result: { id: number; wbsCode: string }[] = [];
  function walk(ns: import('@/lib/wbs-utils').WbsNode[]) {
    ns.forEach((n) => { result.push({ id: n.id, wbsCode: n.wbsCode }); walk(n.children); });
  }
  walk(nodes);
  return result;
}
