import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

// We update the type of getToken to accept the Clerk options object
export const createClerksupabase = (getToken: (options?: { template: string }) => Promise<string | null>) => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // 1. Determine which template to use based on the environment variable
          const env = process.env.NEXT_PUBLIC_APP_ENV || 'production';
          const template = env === 'development' ? 'supabase-dev' : 'supabase-prod';

          // 2. Pass the template name into getToken so Clerk gives us the correct "passport"
          const clToken = await getToken({ template });
          console.log('Token received:', clToken ? 'YES' : 'NULL'); 
          
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