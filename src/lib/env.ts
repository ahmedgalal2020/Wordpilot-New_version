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
  return Boolean((import.meta.env.VITE_GEMINI_API_KEY ?? '').trim());
}

export const clientEnv = {
  ...requiredClientEnv,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '',
};
