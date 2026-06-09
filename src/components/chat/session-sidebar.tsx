'use client';

import * as React from 'react';
import { PlusIcon, TrashIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Session = {
  id: number;
  title: string | null;
  projectId: number | null;
  updatedAt: Date;
};

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteSession: (id: number) => void;
  open: boolean;
  onClose: () => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  open,
  onClose,
}: SessionSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r bg-background transition-all duration-200',
          'w-0 lg:w-64 overflow-hidden',
          open && 'absolute inset-y-0 left-0 z-50 w-64 lg:relative'
        )}
      >
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Chats</h2>
          <Button variant="ghost" size="icon-sm" onClick={onNewChat}>
            <PlusIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              No conversations yet
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                  session.id === activeSessionId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{session.title ?? 'New Chat'}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <TrashIcon className="size-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}