'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { encodeApiKey, type AIProvider, type AIConfig } from '@/lib/ai/models';

export async function updateAIConfig(config: AIConfig) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Validate provider
  const validProviders: AIProvider[] = ['openai', 'anthropic', 'google', 'openrouter', 'ollama'];
  if (!validProviders.includes(config.provider)) {
    return { error: 'Invalid provider' };
  }

  // Validate model is non-empty
  if (!config.model || config.model.trim() === '') {
    return { error: 'Model is required' };
  }

  // If no new key is submitted, preserve whatever is already stored
  let preservedKey: string | undefined;
  if (!config.apiKeyEncrypted) {
    const [existing] = await db
      .select({ aiConfig: profiles.aiConfig })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    const existingConfig = existing?.aiConfig as AIConfig | null;
    preservedKey = existingConfig?.apiKeyEncrypted;
  }

  // Encode API key if provided (stored as base64 for obfuscation)
  const storedConfig: AIConfig = {
    provider: config.provider,
    model: config.model,
    apiKeyEncrypted: config.apiKeyEncrypted ? encodeApiKey(config.apiKeyEncrypted) : preservedKey,
    baseUrl: config.baseUrl || undefined,
  };

  try {
    await db
      .update(profiles)
      .set({
        aiConfig: storedConfig as any,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath('/settings');
    revalidatePath('/ai-chat');
    return { success: true };
  } catch (error) {
    console.error('Failed to update AI config:', error);
    return { error: 'Failed to save settings' };
  }
}

export async function getAIConfig(): Promise<{ config: AIConfig | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { config: null, error: 'Not authenticated' };

  const [profile] = await db
    .select({ aiConfig: profiles.aiConfig })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return { config: null, error: 'Profile not found' };

  // Don't expose the encrypted key to the client — just whether one exists
  const rawConfig = profile.aiConfig as AIConfig | null;
  if (!rawConfig) return { config: null };

  return {
    config: {
      provider: rawConfig.provider,
      model: rawConfig.model,
      apiKeyEncrypted: rawConfig.apiKeyEncrypted ? '••••••••' : undefined, // mask it
      baseUrl: rawConfig.baseUrl,
    },
  };
}