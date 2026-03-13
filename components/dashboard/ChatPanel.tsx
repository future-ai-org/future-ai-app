'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? copy.dashboard.askError);
        return;
      }
      if (data.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content! }]);
      }
    } catch {
      setError(copy.dashboard.askError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <p className="text-muted-foreground text-sm">{copy.dashboard.askEmpty}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-4 py-2.5 text-sm',
                m.role === 'user'
                  ? 'bg-violet-500/20 text-violet-100'
                  : 'bg-border/60 text-foreground'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2.5 text-sm bg-border/60 text-muted-foreground">
              …
            </div>
          </div>
        )}
        {error && (
          <p className="text-red-400/90 text-sm">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={copy.dashboard.askPlaceholder}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none"
          disabled={loading}
        />
        <Button type="submit" variant="primary" disabled={loading || !input.trim()}>
          {copy.dashboard.askSend}
        </Button>
      </form>
    </section>
  );
}
