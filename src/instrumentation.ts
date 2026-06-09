export async function register() {
  // Vercel Runtime Logs: unhandled errors are automatically captured
  // and visible in the Vercel dashboard under Observability → Logs.
  // No additional setup required.
  //
  // For Sentry (optional upgrade):
  //   1. npx @sentry/wizard@latest -i nextjs
  //   2. Set SENTRY_DSN in Vercel environment variables
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason) => {
      console.error('[Unhandled Rejection]', reason);
    });
  }
}

export const onRequestError = async (
  err: { digest?: string; message?: string },
  request: { path: string; method: string },
) => {
  // Vercel captures this automatically. Extend here to push to Sentry, Datadog, etc.
  console.error('[Request Error]', {
    digest: err.digest,
    message: err.message,
    path: request.path,
    method: request.method,
  });
};
