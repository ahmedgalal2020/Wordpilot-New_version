import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export type ShadowingQuota = { allowed: boolean; used: number; limit: number; isPro: boolean; videoIds: string[] };

export function useShadowingQuota(userId: string | undefined, videoId: string) {
  const [snapshot, setSnapshot] = useState<{ owner: string; data: ShadowingQuota } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const key = `${userId ?? ''}:${videoId}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const busy = useRef(false);
  const controllers = useRef(new Set<AbortController>());

  async function request(target: string | null, consume: boolean) {
    const controller = new AbortController();
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const { data, error } = await supabase.rpc('shadowing_video_access', {
        p_video_id: target, p_consume: consume,
      }).abortSignal(controller.signal);
      if (error || !data || typeof data.allowed !== 'boolean' || !Array.isArray(data.videoIds)) throw new Error('Quota unavailable');
      return data as ShadowingQuota;
    } finally {
      clearTimeout(timer);
      controllers.current.delete(controller);
    }
  }

  useEffect(() => {
    let active = true;
    setBlocked(false);
    setError(false);
    if (userId) void request(null, false).then(data => {
      if (active) setSnapshot({ owner: userId, data });
    }).catch(() => { if (active) setError(true); });
    return () => {
      active = false;
      currentKey.current = '';
      controllers.current.forEach(controller => controller.abort());
    };
  }, [userId]);

  useEffect(() => { setBlocked(false); setPending(false); }, [videoId, userId]);

  async function ensure(target = videoId) {
    if (!userId || !target || busy.current) return false;
    const requestKey = currentKey.current;
    busy.current = true;
    setPending(true);
    setError(false);
    try {
      const data = await request(target, true);
      if (currentKey.current !== requestKey) return false;
      setSnapshot({ owner: userId, data });
      setBlocked(!data.allowed);
      return data.allowed;
    } catch {
      if (currentKey.current === requestKey) setError(true);
      return false;
    } finally {
      busy.current = false;
      if (currentKey.current === requestKey) setPending(false);
    }
  }
  const data = snapshot?.owner === userId ? snapshot.data : null;
  return { data, pending, error, blocked, ensure, dismiss: () => setBlocked(false) };
}
