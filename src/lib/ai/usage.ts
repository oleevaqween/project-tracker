import { db } from '@/db';
import { aiUsageLog } from '@/db/schema';

export async function logAIUsage(params: {
  userId: string;
  operationType: string;
  modelName: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostMicroCents?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(aiUsageLog).values({
      userId: params.userId,
      operationType: params.operationType,
      modelName: params.modelName,
      promptTokens: params.promptTokens ?? null,
      completionTokens: params.completionTokens ?? null,
      estimatedCostMicroCents: params.estimatedCostMicroCents ?? null,
      latencyMs: params.latencyMs ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (error) {
    // Log but don't throw — usage logging is non-critical
    console.error('Failed to log AI usage:', error);
  }
}

// Rough cost estimates in micro-cents (1/1,000,000 of a dollar)
const MODEL_COSTS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'gpt-4o': { prompt: 2.5, completion: 10 },
  'gpt-4.1-mini': { prompt: 0.4, completion: 1.6 },
  'gpt-4.1': { prompt: 2, completion: 8 },
  'claude-sonnet-4-6-20250514': { prompt: 3, completion: 15 },
  'claude-opus-4-8': { prompt: 15, completion: 75 },
  'gemini-2.5-flash': { prompt: 0.15, completion: 0.6 },
  'gemini-2.5-pro': { prompt: 1.25, completion: 10 },
};

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['gpt-4o-mini'];
  return Math.round(promptTokens * costs.prompt + completionTokens * costs.completion);
}