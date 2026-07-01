import { streamText, convertToModelMessages, generateText, stepCountIs } from 'ai';
import { getEffectiveConfig, isAIConfigured, getConfigLabel, type AIConfig } from '@/lib/ai/models';
import { allTools } from '@/lib/ai/tools';
import { logAIUsage, estimateCost } from '@/lib/ai/usage';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { db } from '@/db';
import { profiles, projects, chatSessions, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import type { UIMessage } from 'ai';

export const maxDuration = 60; // Allow up to 60 seconds for AI responses

export async function POST(request: Request) {
  // Check if AI is configured
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get user profile for AI config
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const aiConfig = profile.aiConfig as AIConfig | null;

  if (!isAIConfigured(aiConfig)) {
    const label = aiConfig?.provider ?? 'openai';
    return new Response(
      JSON.stringify({
        error: `AI is not configured. Please add your ${label === 'openai' ? 'OpenAI' : label === 'anthropic' ? 'Anthropic' : label === 'google' ? 'Google' : label === 'openrouter' ? 'OpenRouter' : 'AI'} API key in Settings.`,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse request body
  const body = await request.json();
  const { messages, sessionId, projectId } = body as {
    messages: UIMessage[];
    sessionId?: number;
    projectId?: number;
  };

  // Get or create a chat session
  const isNewSession = !sessionId;
  let effectiveSessionId = sessionId;
  if (!effectiveSessionId) {
    // Temporary title from first message; will be replaced by auto-generated title after response
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const tempTitle = firstUserMsg
      ? (firstUserMsg.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; text: string }).text)
          .join(' ')
          .slice(0, 100) ?? 'New Chat')
      : 'New Chat';

    const [newSession] = await db
      .insert(chatSessions)
      .values({
        userId: user.id,
        projectId: projectId ?? null,
        title: tempTitle,
      })
      .returning();
    effectiveSessionId = newSession.id;
  }

  // Save user messages to DB
  if (effectiveSessionId) {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length > 0) {
      await db.insert(chatMessages).values(
        userMessages.map((m) => ({
          sessionId: effectiveSessionId!,
          role: m.role,
          content: m.parts
            ?.filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text)
            .join('\n') ?? '',
        }))
      );
    }
  }

  // Fetch all user projects (used for name resolution when no project is selected)
  const userProjects = await db
    .select({ id: projects.id, name: projects.name, status: projects.status })
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.name);

  // Get project context if projectId is provided
  let projectContext:
    | { id: number; name: string; status: string; focusArea: string | null; description: string | null; progressPercent: number | null }
    | undefined;

  if (projectId) {
    const match = userProjects.find((p) => p.id === projectId);
    if (match) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (project) {
        projectContext = {
          id: project.id,
          name: project.name,
          status: project.status,
          focusArea: project.currentFocusArea,
          description: project.description,
          progressPercent: project.progressPercent,
        };
      }
    }
  }

  // Get the LLM model from user's config
  const { model, config } = getEffectiveConfig(aiConfig);
  const systemPrompt = buildSystemPrompt(aiConfig as any, projectContext, userProjects);
  const startTime = Date.now();

  // Convert UIMessages to model messages
  const modelMessages = await convertToModelMessages(messages, {
    tools: allTools,
  });

  // Stream the response
  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    tools: allTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, usage, finishReason }) => {
      // Log usage asynchronously
      const latencyMs = Date.now() - startTime;
      logAIUsage({
        userId: user.id,
        operationType: 'chat_completion',
        modelName: config.model,
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        estimatedCostMicroCents: estimateCost(
          config.model,
          usage.inputTokens ?? 0,
          usage.outputTokens ?? 0
        ),
        latencyMs,
        metadata: { sessionId: effectiveSessionId, projectId, finishReason, provider: config.provider },
      }).catch(console.error);

      // Save assistant message to DB
      if (effectiveSessionId) {
        db.insert(chatMessages)
          .values({
            sessionId: effectiveSessionId,
            role: 'assistant',
            content: text,
            modelUsed: config.model,
            tokenUsage: {
              prompt: usage.inputTokens ?? 0,
              completion: usage.outputTokens ?? 0,
              total: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            },
          })
          .then(() => {
            return db
              .update(chatSessions)
              .set({ updatedAt: new Date() })
              .where(eq(chatSessions.id, effectiveSessionId!));
          })
          .catch(console.error);

        // Auto-generate a descriptive title for new sessions after first response
        if (isNewSession) {
          const firstUserMsg = messages.find((m) => m.role === 'user');
          const userText = (firstUserMsg?.parts ?? [])
            .filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text)
            .join(' ');

          // Use few-shot examples so even weaker models understand the noun-phrase format.
          const titlePrompt = `Summarize a user request as a 3-5 word noun phrase. Never use question form. Output ONLY the phrase.\n\nExamples:\n"What risks should I watch?" → Risk monitoring review\n"Can you summarize my project?" → Project status summary\n"Help me create a task for onboarding" → Onboarding task creation\n\nRequest: "${userText.slice(0, 150)}"`;

          generateText({
            model,
            prompt: titlePrompt,
            maxOutputTokens: 20,
          }).then(({ text: generatedTitle }) => {
            // Strip any prefix the model might echo, take first line, strip punctuation
            let clean = generatedTitle.trim()
              .replace(/^(Title|Summary|Topic|Label|Answer|Phrase|Name):\s*/i, '')
              .split('\n')[0]
              .replace(/^["'`«»""]|["'`«»""]$/g, '')
              .replace(/→\s*/, '')
              .replace(/[?!]+$/, '')
              .trim();

            // If the model echoed the question or produced nothing useful, fall back to
            // a simple noun extraction from the user message.
            const looksLikeQuestion = !clean || /^(what|how|can|could|please|help|why|when|is|are)\b/i.test(clean);
            if (looksLikeQuestion) {
              clean = userText
                .replace(/^(what\s+|how\s+|can\s+(you\s+)?|could\s+(you\s+)?|please\s+|help\s+(me\s+)?|why\s+|when\s+|is\s+|are\s+)/i, '')
                .split(/\s+/).slice(0, 5).join(' ')
                .replace(/[?!.,;:]+$/, '');
              clean = clean.charAt(0).toUpperCase() + clean.slice(1);
            }

            if (clean.length > 60) clean = clean.slice(0, 60).trim();

            if (clean) {
              return db
                .update(chatSessions)
                .set({ title: clean })
                .where(eq(chatSessions.id, effectiveSessionId!));
            }
          }).catch(console.error);
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}