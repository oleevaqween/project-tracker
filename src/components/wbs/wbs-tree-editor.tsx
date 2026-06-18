'use client';

import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WbsKeyboardStrip } from '@/components/wbs/wbs-keyboard-strip';
import { WbsNodeComponent } from '@/components/wbs/wbs-node';
import { buildWbsTree, resolveParentId, resolveOrderIndex, type WbsElement, type EditRow } from '@/lib/wbs-utils';
import { createWbsElement, updateWbsElement, deleteWbsElement, getWbsElements } from '@/actions/wbs';
import { toast } from 'sonner';

interface WbsTreeEditorProps {
  projectId: number;
  initialElements: WbsElement[];
}

let rowKeyCounter = 0;
function nextKey() { return `row-${++rowKeyCounter}`; }

export function WbsTreeEditor({ projectId, initialElements }: WbsTreeEditorProps) {
  const [elements, setElements] = React.useState<WbsElement[]>(initialElements);
  const [editRows, setEditRows] = React.useState<EditRow[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const inputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());

  const tree = buildWbsTree(elements);

  function startAdding() {
    const key = nextKey();
    setEditRows([{ key, dbId: null, name: '', level: 0 }]);
    setIsAdding(true);
    requestAnimationFrame(() => inputRefs.current.get(key)?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    const rows = [...editRows];
    const row = rows[index];

    if (e.key === 'Enter') {
      e.preventDefault();
      commitRow(index, rows, () => {
        const key = nextKey();
        const newRow: EditRow = { key, dbId: null, name: '', level: row.level };
        const updated = [...rows];
        updated.splice(index + 1, 0, newRow);
        setEditRows(updated);
        requestAnimationFrame(() => inputRefs.current.get(key)?.focus());
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (row.level > 0) {
          rows[index] = { ...row, level: row.level - 1 };
          setEditRows(rows);
        }
      } else {
        if (index > 0) {
          const maxLevel = rows[index - 1].level + 1;
          rows[index] = { ...row, level: Math.min(row.level + 1, maxLevel) };
          setEditRows(rows);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (row.name.trim() === '') {
        const updated = rows.filter((_, i) => i !== index);
        if (updated.length === 0) { setIsAdding(false); setEditRows([]); }
        else setEditRows(updated);
      } else {
        commitRow(index, rows, () => { setIsAdding(false); setEditRows([]); });
      }
    }
  }

  async function commitRow(index: number, rows: EditRow[], after?: () => void) {
    const row = rows[index];
    if (!row.name.trim()) { after?.(); return; }

    const parentId = resolveParentId(rows, index);
    const orderIndex = resolveOrderIndex(parentId, elements);

    try {
      const { id, wbsCode } = await createWbsElement({
        projectId,
        parentId,
        name: row.name.trim(),
        orderIndex,
      });

      const newElement: WbsElement = {
        id,
        projectId,
        userId: '',
        parentId,
        wbsCode,
        name: row.name.trim(),
        description: null,
        acceptanceCriteria: null,
        responsibleParty: null,
        estimatedCost: null,
        dictionaryDetails: null,
        orderIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setElements((prev) => [...prev, newElement]);

      const updated = [...rows];
      updated[index] = { ...row, dbId: id };
      setEditRows(updated);

      after?.();
    } catch {
      toast.error('Failed to save WBS element');
    }
  }

  async function handleUpdate(id: number, data: Partial<WbsElement>) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }

  async function handleSave(id: number) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    try {
      await updateWbsElement(id, {
        name: el.name,
        description: el.description,
        acceptanceCriteria: el.acceptanceCriteria,
        responsibleParty: el.responsibleParty,
        estimatedCost: el.estimatedCost,
        dictionaryDetails: el.dictionaryDetails,
      });
    } catch {
      toast.error('Failed to update element');
    }
  }

  async function handlePromote(nodeId: number) {
    const node = elements.find((e) => e.id === nodeId);
    if (!node || node.parentId === null) return;
    const parent = elements.find((e) => e.id === node.parentId);
    const newParentId = parent?.parentId ?? null;
    setElements((prev) => prev.map((e) => e.id === nodeId ? { ...e, parentId: newParentId } : e));
    try {
      await updateWbsElement(nodeId, { parentId: newParentId });
      const fresh = await getWbsElements(projectId);
      setElements(fresh as WbsElement[]);
    } catch {
      toast.error('Failed to promote element');
      setElements(initialElements);
    }
  }

  async function handleDemote(nodeId: number) {
    const node = elements.find((e) => e.id === nodeId);
    if (!node) return;
    const siblings = elements
      .filter((e) => e.parentId === node.parentId && e.id !== nodeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const prevSibling = siblings.filter((s) => s.orderIndex < node.orderIndex).pop();
    if (!prevSibling) return;
    setElements((prev) => prev.map((e) => e.id === nodeId ? { ...e, parentId: prevSibling.id } : e));
    try {
      await updateWbsElement(nodeId, { parentId: prevSibling.id });
      const fresh = await getWbsElements(projectId);
      setElements(fresh as WbsElement[]);
    } catch {
      toast.error('Failed to indent element');
      setElements(initialElements);
    }
  }

  async function handleDelete(id: number) {
    setElements((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteWbsElement(id);
    } catch {
      toast.error('Failed to delete element');
    }
  }

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  async function handleDictionaryUpdate(id: number, data: Partial<WbsElement>) {
    handleUpdate(id, data);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => handleSave(id), 800);
  }

  return (
    <div className="flex flex-col gap-4">
      <WbsKeyboardStrip />

      {tree.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="p-3">
            {tree.map((node, index) => (
              <WbsNodeComponent
                key={node.id}
                node={node}
                depth={0}
                hasPrevSibling={index > 0}
                onUpdate={handleDictionaryUpdate}
                onDelete={handleDelete}
                onSave={handleSave}
                onPromote={handlePromote}
                onDemote={handleDemote}
              />
            ))}
          </div>
        </div>
      )}

      {isAdding && (
        <div className="rounded-xl border border-primary/30 bg-card overflow-hidden p-3 flex flex-col gap-0.5">
          {editRows.map((row, index) => (
            <div
              key={row.key}
              className="flex items-center gap-2"
              style={{ paddingLeft: `${row.level * 20}px` }}
            >
              <span className="font-mono text-[10px] text-muted-foreground/40 w-8 shrink-0">
                {row.level === 0
                  ? String(elements.filter((e) => e.parentId == null).length + 1)
                  : '•'}
              </span>
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(row.key, el);
                  else inputRefs.current.delete(row.key);
                }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
                value={row.name}
                placeholder={
                  index === 0 && editRows.length === 1
                    ? 'Type a deliverable name, then hit ↵'
                    : '↵ next · ⇥ indent · ⇧⇥ outdent'
                }
                onChange={(e) => {
                  const updated = [...editRows];
                  updated[index] = { ...row, name: e.target.value };
                  setEditRows(updated);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="self-start gap-1.5"
        onClick={startAdding}
      >
        <PlusIcon className="size-3.5" />
        Add deliverable
      </Button>
    </div>
  );
}
