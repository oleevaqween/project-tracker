import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel, EmbeddingModel } from 'ai';

// ---------- Types ----------

export type AIProvider = 'openai' | 'openrouter' | 'google' | 'anthropic' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKeyEncrypted?: string; // base64-encoded API key (per-user)
  baseUrl?: string;          // for OpenRouter or custom endpoints
}

/** Available models per provider */
export const PROVIDER_MODELS: Record<AIProvider, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (fast, cheap)' },
    { id: 'gpt-4o', name: 'GPT-4o (balanced)' },
    { id: 'gpt-4.1', name: 'GPT-4.1 (latest)' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'o3-mini', name: 'o3 Mini (reasoning)' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6-20250514', name: 'Claude Sonnet 4.6 (balanced)' },
    { id: 'claude-opus-4-8-20250609', name: 'Claude Opus 4.8 (powerful)' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (fast, cheap)' },
  ],
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (powerful)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (fast)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-4-6-20250514', name: 'Claude Sonnet 4.6 (via OpenRouter)' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (via OpenRouter)' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenRouter)' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick (via OpenRouter)' },
  ],
  ollama: [
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' },
    { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B' },
    { id: 'qwen2.5:32b', name: 'Qwen 2.5 32B' },
    { id: 'gemma3:9b', name: 'Gemma 3 9B' },
    { id: 'gemma3:27b', name: 'Gemma 3 27B' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B' },
    { id: 'deepseek-r1:32b', name: 'DeepSeek R1 32B' },
    { id: 'llama3.3:70b', name: 'Llama 3.3 70B' },
    { id: 'llama3.1:8b', name: 'Llama 3.1 8B (local)' },
    { id: 'mistral:7b', name: 'Mistral 7B (local)' },
  ],
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  google: 'Google AI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (Local / Cloud)',
};

export const PROVIDER_KEY_LABELS: Record<AIProvider, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_AI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  ollama: 'OLLAMA_API_KEY (leave blank for local)',
};

// ---------- Embedding Model (locked to OpenAI) ----------

let _embeddingModel: EmbeddingModel | null = null;

export function getEmbeddingModel(): EmbeddingModel {
  if (!_embeddingModel) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    _embeddingModel = openai.embedding('text-embedding-3-small');
  }
  return _embeddingModel;
}

// ---------- API Key Decoding ----------

export function decodeApiKey(encrypted?: string): string | undefined {
  if (!encrypted) return undefined;
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return undefined;
  }
}

export function encodeApiKey(key: string): string {
  return Buffer.from(key, 'utf-8').toString('base64');
}

// ---------- Language Model Factory ----------

function getApiKey(config: AIConfig): string | undefined {
  // Prefer per-user key from profile, fall back to env var
  if (config.apiKeyEncrypted) {
    return decodeApiKey(config.apiKeyEncrypted);
  }
  switch (config.provider) {
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'anthropic': return process.env.ANTHROPIC_API_KEY;
    case 'google': return process.env.GOOGLE_AI_API_KEY;
    case 'openrouter': return process.env.OPENROUTER_API_KEY;
    case 'ollama': return process.env.OLLAMA_API_KEY ?? undefined;
    default: return undefined;
  }
}

export function getLanguageModel(config: AIConfig): LanguageModel {
  const apiKey = getApiKey(config);

  switch (config.provider) {
    case 'openai': {
      const provider = createOpenAI({ apiKey });
      return provider.chat(config.model);
    }
    case 'anthropic': {
      const provider = createAnthropic({ apiKey });
      return provider(config.model);
    }
    case 'google': {
      const provider = createGoogleGenerativeAI({ apiKey });
      return provider(config.model);
    }
    case 'openrouter': {
      const provider = createOpenAI({
        apiKey,
        baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      });
      return provider.chat(config.model);
    }
    case 'ollama': {
      // If an API key is present (user key or env var), route to Ollama Cloud.
      // Otherwise fall back to local Ollama at localhost.
      const ollamaKey = apiKey;
      const provider = createOpenAI({
        apiKey: ollamaKey ?? 'unused',
        baseURL: ollamaKey
          ? 'https://ollama.com/v1'
          : (config.baseUrl || 'http://localhost:11434/v1'),
      });
      return provider.chat(config.model);
    }
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

// ---------- Config Helpers ----------

const DEFAULT_CONFIG: AIConfig = { provider: 'openai', model: 'gpt-4o-mini' };

export function getEffectiveConfig(config: AIConfig | null): {
  model: LanguageModel;
  config: AIConfig;
} {
  const effective = config ?? DEFAULT_CONFIG;
  return {
    model: getLanguageModel(effective),
    config: effective,
  };
}

export function isAIConfigured(config: AIConfig | null): boolean {
  const effective = config ?? DEFAULT_CONFIG;
  return !!getApiKey(effective);
}

/** Human-readable label for the current provider config */
export function getConfigLabel(config: AIConfig | null): string {
  const effective = config ?? DEFAULT_CONFIG;
  return `${PROVIDER_LABELS[effective.provider]} / ${effective.model}`;
}