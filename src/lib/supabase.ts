import { createClient } from '@supabase/supabase-js';
import { clientEnv, hasSupabaseEnv } from './env';
import { authFetch } from './authFetch';

const fallbackUrl = 'https://example.supabase.co';
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder.placeholder';

export const supabase = createClient(
  hasSupabaseEnv() ? clientEnv.supabaseUrl : fallbackUrl,
  hasSupabaseEnv() ? clientEnv.supabaseAnonKey : fallbackAnonKey,
  {
    global: { fetch: authFetch },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
