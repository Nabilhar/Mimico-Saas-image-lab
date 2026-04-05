import { createClient } from '@supabase/supabase-js';

export const createClerksupabase = (getToken: () => Promise<string | null>) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken(); // Get fresh token automatically
          const authHeader = `Bearer ${token}`;

          const headers = new Headers(options.headers);
          headers.set('Authorization', authHeader);

          return fetch(url, { ...options, headers });
        },
      },
    }
  );
};