// One-time endpoint: call this once after deployment to register the daily QStash schedule.
// POST /api/notifications/setup
// Authorization: Bearer <CRON_SECRET>
//
// QStash will be configured to call /api/notifications/trigger every day at 08:00 UTC,
// forwarding Authorization: Bearer <CRON_SECRET> so the trigger endpoint can verify it.

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.QSTASH_TOKEN) {
    return Response.json({ error: 'QSTASH_TOKEN not set' }, { status: 500 });
  }

  // Derive the trigger URL from the incoming request's origin
  const origin = new URL(request.url).origin;
  const triggerUrl = `${origin}/api/notifications/trigger`;

  // QStash v2: POST to /v2/publish/<destination-url>
  // Upstash-Cron schedules the message to repeat on a cron expression.
  // Upstash-Forward-* headers are forwarded to the destination as-is.
  const qstashRes = await fetch(
    `https://qstash.upstash.io/v2/publish/${triggerUrl}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Cron': '0 8 * * *',                              // 8:00 AM UTC daily
        'Upstash-Forward-Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Upstash-Retries': '3',
      },
      body: '{}',
    }
  );

  const responseText = await qstashRes.text();

  if (!qstashRes.ok) {
    return Response.json(
      { error: `QStash returned ${qstashRes.status}`, detail: responseText },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = responseText;
  }

  return Response.json({
    ok: true,
    message: 'Daily digest schedule created. Emails will fire every day at 08:00 AM UTC.',
    triggerUrl,
    qstash: parsed,
  });
}
