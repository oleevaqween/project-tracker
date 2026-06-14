export type WbsElement = {
  id: number;
  projectId: number;
  userId: string;
  parentId: number | null;
  wbsCode: string;
  name: string;
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
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WbsNode = WbsElement & { children: WbsNode[] };

// Build nested tree from flat array. Sorts siblings by orderIndex.
export function buildWbsTree(elements: WbsElement[]): WbsNode[] {
  const map = new Map<number, WbsNode>();
  elements.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: WbsNode[] = [];
  [...elements]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((e) => {
      if (e.parentId != null && map.has(e.parentId)) {
        map.get(e.parentId)!.children.push(map.get(e.id)!);
      } else {
        roots.push(map.get(e.id)!);
      }
    });
  return roots;
}

// Assign WBS codes by position in tree. Mutates nodes in place.
export function assignWbsCodes(nodes: WbsNode[], prefix = ''): void {
  nodes
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((node, i) => {
      node.wbsCode = prefix ? `${prefix}.${i + 1}` : String(i + 1);
      if (node.children.length > 0) assignWbsCodes(node.children, node.wbsCode);
    });
}

// A node is a work package if it has no children.
export function isWorkPackage(node: WbsNode): boolean {
  return node.children.length === 0;
}

export type EditRow = {
  key: string;       // unique key (temp or db id)
  dbId: number | null;
  name: string;
  level: number;     // 0 = root
};

// Find parentId for a node at `level` given the flat editing rows above it.
export function resolveParentId(rows: EditRow[], currentIndex: number): number | null {
  const level = rows[currentIndex].level;
  if (level === 0) return null;
  // Search backwards for the nearest row with level - 1
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (rows[i].level === level - 1 && rows[i].dbId != null) {
      return rows[i].dbId;
    }
  }
  return null;
}

// Compute sibling orderIndex for a new/moved node.
export function resolveOrderIndex(
  _rows: EditRow[],
  _currentIndex: number,
  parentId: number | null,
  existingElements: WbsElement[],
): number {
  const siblings = existingElements.filter((e) => e.parentId === parentId);
  return siblings.length;
}

// Completeness for "Use Tasks" projects
export function computeWbsCompleteness(tasks: { wbsElementId: number | null }[]): {
  total: number;
  unassigned: number;
  percent: number;
} {
  const total = tasks.length;
  const unassigned = tasks.filter((t) => t.wbsElementId == null).length;
  const percent = total === 0 ? 0 : Math.round(((total - unassigned) / total) * 100);
  return { total, unassigned, percent };
}

// Dictionary completeness (for report tier detection)
export function dictionaryTier(node: WbsNode): 1 | 2 | 3 {
  const hasTier2 =
    node.description || node.acceptanceCriteria || node.responsibleParty || node.estimatedCost;
  if (!hasTier2) return 1;
  const d = node.dictionaryDetails;
  const hasTier3 = d && (d.milestones || d.resourcesRequired || d.qualityRequirements || d.assumptionsConstraints);
  return hasTier3 ? 3 : 2;
}
