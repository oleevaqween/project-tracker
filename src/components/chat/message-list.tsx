'use client';

import * as React from 'react';
import type { UIMessage, ChatStatus } from 'ai';
import { isToolUIPart, getToolName } from 'ai';
import { BotIcon, UserIcon, Loader2Icon, CheckIcon, XIcon, ShieldAlertIcon, CheckSquareIcon, BookOpenIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const THINKING_PHRASES = [
  'Thinking...',
  'Analyzing your request...',
  'Gathering insights...',
  'Looking into this...',
  'Connecting the dots...',
  'Checking your projects...',
  'Working on it...',
  'Let me think about that...',
  'Pulling relevant data...',
  'Digging into this...',
  'Processing your question...',
  'Consulting the knowledge base...',
  'Almost there...',
  'Putting it all together...',
];

function ThinkingIndicator() {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % THINKING_PHRASES.length);
        setVisible(true);
      }, 250);
    }, 2800);
    return () => clearInterval(tick);
  }, []);

  return (
    <span
      className="text-sm text-muted-foreground"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
    >
      {THINKING_PHRASES[index]}
    </span>
  );
}

function BlinkingCursor() {
  return (
    <span className="inline-block w-[2px] h-[1em] bg-foreground/60 ml-[1px] align-text-bottom animate-pulse" />
  );
}

// Write tools that require confirmation before executing
const WRITE_TOOLS = new Set(['createTask', 'createRisk', 'logLessonLearned']);

const TOOL_ICONS: Record<string, React.ElementType> = {
  createTask: CheckSquareIcon,
  createRisk: ShieldAlertIcon,
  logLessonLearned: BookOpenIcon,
};

const TOOL_LABELS: Record<string, string> = {
  createTask: 'Create Task',
  createRisk: 'Add Risk',
  logLessonLearned: 'Log Lesson Learned',
  searchKnowledgeBase: 'Search Knowledge Base',
  getProjectSummary: 'Get Project Summary',
  listTasks: 'List Tasks',
  listRisks: 'List Risks',
  assessDomainHealth: 'Assess Domain Health',
  suggestRisks: 'Suggest Risks',
  identifyStakeholders: 'Identify Stakeholders',
};

interface MessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  onSuggestionClick?: (text: string) => void;
  onToolConfirm?: (toolCallId: string, toolName: string, input: unknown) => Promise<void>;
  onToolReject?: (toolCallId: string, toolName: string) => void;
  pendingToolCallId?: string | null;
}

export function MessageList({
  messages,
  status,
  onSuggestionClick,
  onToolConfirm,
  onToolReject,
  pendingToolCallId,
}: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const prevLengthRef = React.useRef(messages.length);

  React.useEffect(() => {
    const isNewMessage = messages.length !== prevLengthRef.current;
    prevLengthRef.current = messages.length;
    // Smooth scroll only when a new message bubble appears; instant during streaming
    bottomRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'instant' });
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <BotIcon className="size-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">How can I help?</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Ask me about your projects, tasks, risks, or search your knowledge base. I can also create
          tasks and risks for you.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'What tasks are in progress?',
            'Summarize my project health',
            'What risks should I watch?',
            'Create a task for the review meeting',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isGenerating = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, msgIndex) => {
        const isLastMsg = msgIndex === messages.length - 1;
        const isStreamingThisMsg = isLastMsg && status === 'streaming' && message.role === 'assistant';

        return (
        <div
          key={message.id}
          className={cn(
            'flex gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <BotIcon className="size-4 text-primary" />
            </div>
          )}

          <div
            className={cn(
              'max-w-[80%] rounded-xl px-4 py-2.5 text-sm',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {message.parts.map((part, i) => {
              if (part.type === 'text') {
                const isLastPart = i === message.parts.length - 1;
                const isUser = message.role === 'user';
                return (
                  <div key={i} className="leading-relaxed">
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{part.text}</span>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes('language-');
                            return isBlock
                              ? <code className="block rounded bg-background/60 p-2 text-xs font-mono my-2 overflow-x-auto">{children}</code>
                              : <code className="rounded bg-background/60 px-1 py-0.5 text-xs font-mono">{children}</code>;
                          },
                          pre: ({ children }) => <pre className="my-2">{children}</pre>,
                          h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
                          table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                          th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold bg-background/40">{children}</th>,
                          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                          hr: () => <hr className="my-3 border-border" />,
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    )}
                    {isStreamingThisMsg && isLastPart && <BlinkingCursor />}
                  </div>
                );
              }

              if (isToolUIPart(part)) {
                // In AI SDK v6, toolName is encoded in part.type as 'tool-{name}'.
                // toolCallId, state, input, output, errorText are flat on the part.
                const toolPart = part as typeof part & {
                  toolCallId: string;
                  state: string;
                  input?: unknown;
                  output?: unknown;
                  errorText?: string;
                };
                const toolName = getToolName(part);

                const isWriteTool = WRITE_TOOLS.has(toolName);
                const isPending = toolPart.state === 'input-available' && isWriteTool;
                const isConfirming = pendingToolCallId === toolPart.toolCallId;
                const isDone = toolPart.state === 'output-available';
                const isError = toolPart.state === 'output-error';
                const Icon = TOOL_ICONS[toolName] ?? CheckSquareIcon;
                const label = TOOL_LABELS[toolName] ?? formatToolName(toolName);

                if (isPending) {
                  // Show confirmation card
                  const inputObj = toolPart.input as Record<string, unknown> ?? {};
                  return (
                    <div key={i} className="mt-2 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 mb-2">
                        <Icon className="size-3.5" />
                        {label}: Confirm action?
                      </div>
                      <div className="mb-3 space-y-1 text-muted-foreground">
                        {Object.entries(inputObj).map(([k, v]) => (
                          v !== undefined && v !== null && (
                            <div key={k} className="flex gap-1.5">
                              <span className="font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{String(v)}</span>
                            </div>
                          )
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={isConfirming}
                          onClick={() => onToolConfirm?.(toolPart.toolCallId, toolName, toolPart.input)}
                        >
                          {isConfirming ? <Loader2Icon className="size-3 animate-spin" /> : <CheckIcon className="size-3" />}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          disabled={isConfirming}
                          onClick={() => onToolReject?.(toolPart.toolCallId, toolName)}
                        >
                          <XIcon className="size-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                }

                // Completed or in-progress read tool
                return (
                  <div key={i} className="mt-2 rounded-lg border bg-background/50 p-2 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      {isDone ? '✓' : isError ? '✗' : <Loader2Icon className="size-3 animate-spin" />}{' '}
                      {label}
                    </div>
                    {isDone && (
                      <div className="mt-1 text-muted-foreground">
                        {formatToolResult(toolPart.output)}
                      </div>
                    )}
                    {isError && (
                      <div className="mt-1 text-destructive">{toolPart.errorText ?? 'Tool error'}</div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>

          {message.role === 'user' && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
              <UserIcon className="size-4 text-secondary-foreground" />
            </div>
          )}
        </div>
        );
      })}

      {/* Thinking indicator — shown while waiting for first token */}
      {status === 'submitted' && (
        <div className="flex gap-3 justify-start">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="size-4 text-primary" />
          </div>
          <div className="rounded-xl bg-muted px-4 py-3">
            <ThinkingIndicator />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatToolResult(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const obj = result as Record<string, unknown>;

  if ('found' in obj && obj.found === false) return (obj.message as string) ?? 'No results found';
  if ('success' in obj && obj.success === true) return 'Action completed successfully';
  if ('error' in obj) return `Error: ${obj.error}`;
  if ('tasks' in obj && Array.isArray(obj.tasks)) return `Found ${obj.tasks.length} task(s)`;
  if ('risks' in obj && Array.isArray(obj.risks)) return `Found ${obj.risks.length} risk(s)`;
  if ('sources' in obj && Array.isArray(obj.sources)) return `Found ${(obj.sources as unknown[]).length} relevant source(s)`;
  if ('project' in obj) {
    const p = obj.project as Record<string, unknown>;
    const t = obj.taskStats as Record<string, unknown>;
    const r = obj.riskStats as Record<string, unknown>;
    return `${p?.name}: ${t?.total ?? 0} tasks, ${r?.total ?? 0} risks`;
  }
  return 'Result received';
}
