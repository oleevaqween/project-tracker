'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, ChevronDownIcon, Trash2Icon, BookOpenIcon, IndentIcon, OutdentIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WbsDictionary } from '@/components/wbs/wbs-dictionary';
import { isWorkPackage, type WbsNode as WbsNodeType, type WbsElement } from '@/lib/wbs-utils';

interface WbsNodeProps {
  node: WbsNodeType;
  depth?: number;
  hasPrevSibling?: boolean;
  onUpdate: (id: number, data: Partial<WbsElement>) => void;
  onDelete: (id: number) => void;
  onSave: (id: number) => void;
  onPromote?: (id: number) => void;
  onDemote?: (id: number) => void;
}

export function WbsNodeComponent({ node, depth = 0, hasPrevSibling = false, onUpdate, onDelete, onSave, onPromote, onDemote }: WbsNodeProps) {
  const [childrenOpen, setChildrenOpen] = React.useState(true);
  const [dictOpen, setDictOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(node.name);
  const workPackage = isWorkPackage(node);

  function handleNameBlur() {
    setEditing(false);
    if (name.trim() && name.trim() !== node.name) {
      onUpdate(node.id, { name: name.trim() });
      onSave(node.id);
    }
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-start gap-1.5 rounded-lg py-1.5 pr-2 transition-colors hover:bg-muted/30',
          depth > 0 && 'border-l-2 border-primary/15',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/collapse children */}
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => setChildrenOpen((o) => !o)}
            className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-foreground"
          >
            {childrenOpen
              ? <ChevronDownIcon className="size-3.5" />
              : <ChevronRightIcon className="size-3.5" />}
          </button>
        ) : (
          <span className="mt-0.5 size-3.5 shrink-0" />
        )}

        {/* WBS code */}
        <code className="mt-0.5 shrink-0 font-mono text-[10px] text-primary/60 bg-primary/5 px-1 py-0.5 rounded leading-none">
          {node.wbsCode}
        </code>

        {/* Work package indicator */}
        {workPackage && (
          <span className="mt-0.5 shrink-0 inline-flex items-center rounded-sm bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
            WP
          </span>
        )}

        {/* Name: editable inline */}
        {editing ? (
          <input
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-primary/40 pb-0.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleNameBlur(); }
              if (e.key === 'Escape') { setEditing(false); setName(node.name); }
            }}
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-sm text-foreground cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {node.name}
          </span>
        )}

        {/* Actions: visible on hover */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Promote: move up one level */}
          {depth > 0 && onPromote && (
            <button
              type="button"
              onClick={() => onPromote(node.id)}
              className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Promote — move up one level"
            >
              <OutdentIcon className="size-3.5" />
            </button>
          )}
          {/* Demote: move under previous sibling */}
          {hasPrevSibling && onDemote && (
            <button
              type="button"
              onClick={() => onDemote(node.id)}
              className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Demote — move under previous item"
            >
              <IndentIcon className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDictOpen((o) => !o)}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              dictOpen ? 'text-primary' : 'text-muted-foreground/50',
            )}
            title="WBS Dictionary"
          >
            <BookOpenIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors"
            title="Delete element"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Dictionary: slides in below the node */}
      <AnimatePresence>
        {dictOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-6"
          >
            <WbsDictionary
              element={node}
              onUpdate={(data) => onUpdate(node.id, data)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {childrenOpen && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child, index) => (
              <WbsNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                hasPrevSibling={index > 0}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSave={onSave}
                onPromote={onPromote}
                onDemote={onDemote}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
