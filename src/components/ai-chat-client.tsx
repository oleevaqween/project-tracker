'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import {
  BotIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
  AlertCircleIcon,
  SettingsIcon,
  FolderKanbanIcon,
  MenuIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { isAIConfigured, getConfigLabel, type AIConfig } from '@/lib/ai/models';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { SessionSidebar } from '@/components/chat/session-sidebar';
import { aiCreateTask, aiCreateRisk, aiLogLesson } from '@/actions/ai-tools';
import { toast } from 'sonner';

type Session = {
  id: number;
  userId: string;
  title: string | null;
  projectId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type Project = {
  id: number;
  name: string;
  status: string;
  currentFocusArea: string | null;
  description: string | null;
};

export function AiChatClient({
  sessions: initialSessions,
  projects,
  aiConfig,
  userId,
}: {
  sessions: Session[];
  projects: Project[];
  aiConfig: AIConfig | null;
  userId: string;
}) {
  const [activeSessionId, setActiveSessionId] = React.useState<number | null>(
    initialSessions[0]?.id ?? null
  );
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null);
  const [sessions, setSessions] = React.useState(initialSessions);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pendingToolCallId, setPendingToolCallId] = React.useState<string | null>(null);

  const aiReady = isAIConfigured(aiConfig);

  // AI SDK v6: configure transport with endpoint and extra body params
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { sessionId: activeSessionId, projectId: selectedProjectId },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSessionId, selectedProjectId]
  );

  const { messages, sendMessage, status, stop, setMessages, addToolResult } = useChat({
    transport,
  });

  async function handleToolConfirm(toolCallId: string, toolName: string, input: unknown) {
    setPendingToolCallId(toolCallId);
    try {
      const inp = input as Record<string, unknown>;
      let result: unknown;

      if (toolName === 'createTask') {
        result = await aiCreateTask(inp as Parameters<typeof aiCreateTask>[0]);
      } else if (toolName === 'createRisk') {
        result = await aiCreateRisk(inp as Parameters<typeof aiCreateRisk>[0]);
      } else if (toolName === 'logLessonLearned') {
        result = await aiLogLesson(inp as Parameters<typeof aiLogLesson>[0]);
      } else {
        result = { error: 'Unknown tool' };
      }

      const res = result as Record<string, unknown>;
      if (res?.success) {
        toast.success(`${toolName === 'createTask' ? 'Task' : toolName === 'createRisk' ? 'Risk' : 'Lesson'} created successfully`);
      } else if (res?.error) {
        toast.error(String(res.error));
      }

      addToolResult({ tool: toolName, toolCallId, output: result });
    } catch (err) {
      toast.error('Action failed');
      addToolResult({ tool: toolName, toolCallId, state: 'output-error' as const, errorText: 'Execution failed' });
    } finally {
      setPendingToolCallId(null);
    }
  }

  function handleToolReject(toolCallId: string, toolName: string) {
    addToolResult({ tool: toolName, toolCallId, state: 'output-error' as const, errorText: 'User rejected this action' });
    toast.info('Action rejected');
  }

  async function handleNewChat() {
    setMessages([]);
    setActiveSessionId(null);
  }

  async function handleDeleteSession(sessionId: number) {
    await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }

  function handleSelectSession(sessionId: number) {
    setActiveSessionId(sessionId);
    setMessages([]);
    // Messages will be loaded via the chat API
    setSidebarOpen(false);
  }

  const configLabel = getConfigLabel(aiConfig);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Session sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="size-4" />
            </Button>
            <h2 className="text-sm font-medium">
              {activeSessionId
                ? sessions.find((s) => s.id === activeSessionId)?.title ?? 'Chat'
                : 'New Chat'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Project selector */}
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <span className="text-xs text-muted-foreground">{configLabel}</span>
          </div>
        </div>

        {!aiReady ? (
          /* Not configured state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircleIcon className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">AI Chat Not Configured</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              To use AI Chat, you need to add your API key in Settings. Choose from OpenAI, Anthropic,
              Google, OpenRouter, or use a local Ollama instance.
            </p>
            <Button variant="outline" className="gap-2" render={<a href="/settings" />}>
              <SettingsIcon className="size-4" />
              Go to Settings
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <MessageList
              messages={messages}
              status={status}
              onSuggestionClick={(text) => sendMessage({ text })}
              onToolConfirm={handleToolConfirm}
              onToolReject={(toolCallId, toolName) => handleToolReject(toolCallId, toolName)}
              pendingToolCallId={pendingToolCallId}
            />

            {/* Input */}
            <MessageInput
              onSend={(text) => sendMessage({ text })}
              status={status}
              onStop={stop}
              disabled={!aiReady}
            />
          </>
        )}
      </div>
    </div>
  );
}