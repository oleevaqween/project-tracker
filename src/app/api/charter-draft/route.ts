import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveConfig, isAIConfigured, type AIConfig } from '@/lib/ai/models';

export const maxDuration = 60;

const charterSchema = z.object({
  projectPurpose: z.string().describe('One paragraph explaining why this project exists and what problem it solves'),
  objectives: z.string().describe('3-5 measurable SMART objectives for this project'),
  scopeSummary: z.string().describe('What is in scope and what is explicitly out of scope'),
  deliverables: z.string().describe('Concrete list of deliverables the project will produce'),
  acceptanceCriteria: z.string().describe('How success will be measured; criteria for each deliverable'),
  assumptions: z.string().describe('Key assumptions the project plan is based on'),
  constraints: z.string().describe('Known constraints: time, budget, resources, technology'),
  scheduleSummary: z.string().describe('High-level schedule milestones and estimated timeline'),
  stakeholderOverview: z.string().describe('Key stakeholder groups and their primary interests'),
  riskApproach: z.string().describe('Overall risk management strategy and top risk categories to monitor'),
  successMetrics: z.string().describe('KPIs and measurable criteria that define project success'),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const aiConfig = profile.aiConfig as AIConfig | null;
  if (!isAIConfigured(aiConfig)) {
    return NextResponse.json({ error: 'AI not configured. Add your API key in Settings.' }, { status: 503 });
  }

  const body = await req.json() as {
    name: string;
    description?: string | null;
    category?: string | null;
    budget?: string | null;
    startDate?: string | null;
    targetEndDate?: string | null;
    existingCharter?: Record<string, string | null | undefined>;
  };

  const { model } = getEffectiveConfig(aiConfig);

  // Sanitize user inputs before injecting into prompt
  const san = (v: string | null | undefined, max = 500) =>
    (v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\0/g, '').trim().slice(0, max);

  const result = streamObject({
    model,
    schema: charterSchema,
    prompt: `You are a PMBOK 8th Edition certified project management expert. Draft a professional Project Charter for the following project.

Project Name: ${san(body.name, 200)}
Description: ${san(body.description, 1000)}
Category: ${san(body.category, 100)}
Budget: ${body.budget ? `$${san(body.budget, 50)}` : 'Not set'}
Start Date: ${san(body.startDate, 50)}
Target End Date: ${san(body.targetEndDate, 50)}
${body.existingCharter ? `\nExisting charter content to improve:\n${JSON.stringify(
  Object.fromEntries(
    Object.entries(body.existingCharter).map(([k, v]) => [san(k, 100), san(v ?? '', 1000)])
  ),
  null, 2
)}` : ''}

Generate a complete, professional Project Charter following PMBOK 8th Edition Governance domain best practices. Be specific to this project type. Each section should be substantive (2-5 sentences minimum). Use professional PM language.`,
  });

  return result.toTextStreamResponse();
}
