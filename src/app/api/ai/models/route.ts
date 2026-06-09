import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decodeApiKey, type AIProvider, type AIConfig } from '@/lib/ai/models';

export interface ModelOption {
  id: string;
  name: string;
}

// ── OpenAI ──────────────────────────────────────────────────────────────────

const OPENAI_SKIP = ['audio', 'realtime', 'embed', 'whisper', 'tts', 'dall-e', 'moderation', 'instruct', 'babbage', 'davinci', 'curie', ':001'];

async function fetchOpenAIModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string; created: number; owned_by: string }[] };

  return data
    .filter(
      (m) =>
        m.owned_by === 'openai' &&
        (m.id.startsWith('gpt-') ||
          m.id.startsWith('o1') ||
          m.id.startsWith('o3') ||
          m.id.startsWith('o4') ||
          m.id.startsWith('chatgpt-')) &&
        !OPENAI_SKIP.some((s) => m.id.includes(s)),
    )
    .sort((a, b) => b.created - a.created)
    .map((m) => ({ id: m.id, name: m.id }));
}

// ── Anthropic ────────────────────────────────────────────────────────────────

async function fetchAnthropicModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string; display_name: string }[] };
  return data.map((m) => ({ id: m.id, name: m.display_name ?? m.id }));
}

// ── Google ───────────────────────────────────────────────────────────────────

async function fetchGoogleModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
  );
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const { models } = (await res.json()) as {
    models: { name: string; displayName: string; supportedGenerationMethods?: string[] }[];
  };

  return (models ?? [])
    .filter(
      (m) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        !m.name.includes('vision'), // vision-only variants
    )
    .map((m) => ({ id: m.name.replace(/^models\//, ''), name: m.displayName }));
}

// ── OpenRouter ───────────────────────────────────────────────────────────────

async function fetchOpenRouterModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string; name: string }[] };

  return (data ?? [])
    .filter((m) => !m.id.endsWith(':free') === false || true) // keep all including free tier
    .filter((m) => !m.id.includes('embed'))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({ id: m.id, name: m.name ?? m.id }));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider, apiKey: inputKey }: { provider: AIProvider; apiKey?: string } = await req.json();

  if (provider === 'ollama') {
    return NextResponse.json({ error: 'Ollama runs locally — cannot fetch models server-side' }, { status: 400 });
  }

  // Resolve API key: prefer the one sent in the request (not yet saved), else use stored key
  let apiKey = inputKey;
  if (!apiKey) {
    const [profile] = await db
      .select({ aiConfig: profiles.aiConfig })
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);

    const config = profile?.aiConfig as AIConfig | null;
    if (config?.provider === provider && config?.apiKeyEncrypted) {
      apiKey = decodeApiKey(config.apiKeyEncrypted);
    }
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'No API key — enter your key and save first, or type it in the key field before refreshing.' },
      { status: 400 },
    );
  }

  try {
    let models: ModelOption[];
    switch (provider) {
      case 'openai':
        models = await fetchOpenAIModels(apiKey);
        break;
      case 'anthropic':
        models = await fetchAnthropicModels(apiKey);
        break;
      case 'google':
        models = await fetchGoogleModels(apiKey);
        break;
      case 'openrouter':
        models = await fetchOpenRouterModels(apiKey);
        break;
      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }
    return NextResponse.json(models);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
