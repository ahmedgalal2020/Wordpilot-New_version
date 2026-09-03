const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const requiredClientEnv = {
  supabaseUrl: viteEnv.VITE_SUPABASE_URL,
  supabaseAnonKey: viteEnv.VITE_SUPABASE_ANON_KEY,
};

export const productionAppUrl = (viteEnv.VITE_APP_URL ?? '').trim().replace(/\/$/, '');

export function getAppUrl() {
  if (productionAppUrl) {
    return productionAppUrl;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'https://wordpilot.itscope24.de';
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
  return viteEnv.VITE_AI_GENERATION_ENABLED !== 'false';
}

export const clientEnv = {
  ...requiredClientEnv,
};

