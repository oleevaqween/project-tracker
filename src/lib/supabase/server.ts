import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Node 24 + undici keep-alive causes Supabase fetch calls to hang.
// Forcing Connection: close prevents persistent connections from stalling the server.
// Use the Headers constructor to copy existing headers; spreading a Headers instance
// yields an empty object, which would silently drop the Authorization header.
const supabaseGlobalOptions = {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      const headers = new Headers(options?.headers);
      headers.set('connection', 'close');
      return fetch(url, { ...options, headers });
    },
  },
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...supabaseGlobalOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; safe to ignore.
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      ...supabaseGlobalOptions,
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}
