const requiredClientEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export const productionAppUrl = (import.meta.env.VITE_APP_URL ?? '').trim().replace(/\/$/, '');

export function getAppUrl() {
  if (productionAppUrl) {
    return productionAppUrl;
  }

  return 'https://wordpilot.netlify.app';
}

export function getAppRedirectUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getAppUrl()}${normalizedPath}`;
}

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
