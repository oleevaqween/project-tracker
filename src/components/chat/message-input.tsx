'use client';

import * as React from 'react';
import type { ChatStatus } from 'ai';
import { SendIcon, SquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSend: (message: string) => void;
  status: ChatStatus;
  onStop: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, status, onStop, disabled }: MessageInputProps) {
  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === 'streaming';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;

    onSend(trimmed);
    setInput('');

    // Refocus textarea after sending
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your projects, tasks, risks..."
          disabled={disabled || isStreaming}
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
        />
        {isStreaming ? (
          <Button type="button" variant="outline" size="icon" onClick={onStop}>
            <SquareIcon className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim() || disabled}>
            <SendIcon className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}