import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.' },
      { status: 503 }
    );
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  const normalized = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(m.content ?? ''),
    }));

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system:
          'You are a helpful assistant for an astrology app (natal charts, conjunctions, transits). Be concise and friendly.',
        messages: normalized,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic API error', res.status, err);
      return NextResponse.json(
        {
          error:
            res.status === 401
              ? 'Invalid ANTHROPIC_API_KEY'
              : 'Model request failed',
        },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const textBlock = data.content?.find((b) => b.type === 'text');
    const content = textBlock?.text?.trim() ?? '';
    return NextResponse.json({ content });
  } catch (e) {
    console.error('Chat API error', e);
    return NextResponse.json({ error: 'Request failed' }, { status: 502 });
  }
}
