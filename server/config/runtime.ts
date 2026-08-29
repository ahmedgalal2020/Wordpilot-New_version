import type { Request } from 'express';

export function getAllowedOrigins(req: Request) {
  const configured = [
    process.env.APP_URL,
    process.env.PUBLIC_APP_URL,
    process.env.SITE_URL,
    ...(process.env.ALLOWED_ORIGINS ?? '').split(','),
  ]
    .map((value) => value?.trim().replace(/\/$/, ''))
    .filter(Boolean) as string[];

  const requestOrigin = getRequestOrigin(req);
  return Array.from(new Set([...configured, requestOrigin]));
}

export function getRequestOrigin(req: Request) {
  const configuredOrigin = process.env.APP_URL?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, '');
  }

  const protocol = req.headers['x-forwarded-proto']?.toString() ?? req.protocol;
  const host = req.headers['x-forwarded-host']?.toString() ?? req.headers.host;
  return `${protocol}://${host}`;
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim();
}

export function getSupabaseServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  return { supabaseUrl, anonKey };
}

export function getBearerToken(req: Request) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
