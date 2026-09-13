import { getSupabaseServerConfig } from './config/runtime';

export async function authorizeShadowingVideo(token: string, videoId: unknown) {
  if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return { ok: false, status: 400, code: 'SHADOWING_VIDEO_REQUIRED' };
  }
  const { supabaseUrl, anonKey } = getSupabaseServerConfig();
  if (!supabaseUrl || !anonKey) return { ok: false, status: 503, code: 'SHADOWING_ACCESS_UNAVAILABLE' };
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/shadowing_video_access`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_video_id: videoId, p_consume: true }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    if (!response.ok || typeof data?.allowed !== 'boolean') {
      return { ok: false, status: 503, code: 'SHADOWING_ACCESS_UNAVAILABLE' };
    }
    return data.allowed ? { ok: true, status: 200, code: '' }
      : { ok: false, status: 403, code: 'SHADOWING_VIDEO_LIMIT' };
  } catch {
    return { ok: false, status: 503, code: 'SHADOWING_ACCESS_UNAVAILABLE' };
  }
}
