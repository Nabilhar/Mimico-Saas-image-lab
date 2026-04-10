import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

export const createClerksupabase = (getToken: () => Promise<string | null>) => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // By calling clToken here, we always get the LATEST token
          // from the Clerk session, even if the client was created hours ago.
          const clToken = await getToken();
          const headers = new Headers(options.headers);
          if (clToken) {
            headers.set('Authorization', `Bearer ${clToken}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    }
  );

  return supabaseInstance;
}