const requiredClientEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export function getMissingClientEnv() {
  return Object.entries(requiredClientEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function hasSupabaseEnv() {
  return getMissingClientEnv().length === 0;
}

export function hasGeminiEnv() {
  return import.meta.env.VITE_AI_GENERATION_ENABLED !== 'false';
}

export const clientEnv = {
  ...requiredClientEnv,
};
