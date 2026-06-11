import { timingSafeEqual } from 'crypto';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getNotificationData } from '@/lib/notifications/checks';
import { buildEmailHtml, buildSubject } from '@/lib/notifications/template';

export const maxDuration = 60;

export async function POST(request: Request) {
  // Verify CRON_SECRET — QStash forwards this as the Authorization header
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  const provided = auth ?? '';
  const valid =
    !!process.env.CRON_SECRET &&
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const now = new Date();

  // Use the Supabase admin client to get all registered users and their emails
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 500 });
  if (listError || !data?.users) {
    return Response.json(
      { error: listError?.message ?? 'Failed to list users' },
      { status: 500 }
    );
  }

  type Result = { userId: string; email: string; sent: boolean; skipped?: boolean; error?: string };
  const results: Result[] = [];

  for (const user of data.users) {
    if (!user.email) continue;

    try {
      const notifData = await getNotificationData(user.id);

      if (!notifData) {
        // User has no projects — no email sent
        results.push({ userId: user.id, email: user.email, sent: false, skipped: true });
        continue;
      }

      const html = buildEmailHtml(notifData, now);
      const subject = buildSubject(notifData, now);

      const { error: sendError } = await resend.emails.send({
        from: `aboveone <${fromEmail}>`,
        to: [user.email],
        replyTo: user.email,
        subject,
        html,
      });

      if (sendError) {
        results.push({ userId: user.id, email: user.email, sent: false, error: sendError.message });
      } else {
        results.push({ userId: user.id, email: user.email, sent: true });
      }
    } catch (err) {
      results.push({ userId: user.id, email: user.email, sent: false, error: String(err) });
    }
  }

  const sent = results.filter((r) => r.sent).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.sent && !r.skipped).length;

  return Response.json({ ok: true, sent, skipped, failed, results });
}
