import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { fetchApi } from '../lib/api';

type AdminAccessResult = {
  isAdmin: boolean;
  error: string | null;
};

const ADMIN_ACCESS_CACHE_MS = 60_000;
const adminAccessCache = new Map<string, { expiresAt: number; result: AdminAccessResult }>();
const adminAccessRequests = new Map<string, Promise<AdminAccessResult>>();

export function useAdminAccess(user: User | null) {
  const [databaseAdmin, setDatabaseAdmin] = useState(false);
  const [databaseCheckLoading, setDatabaseCheckLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const supabaseReady = hasSupabaseEnv();

  const needsDatabaseCheck = Boolean(user && supabaseReady);

  useEffect(() => {
    if (!needsDatabaseCheck) {
      setDatabaseAdmin(false);
      setDatabaseError(null);
      setDatabaseCheckLoading(false);
      return;
    }

    let active = true;

    async function loadAdminAccess() {
      if (!user) return;

      const cached = adminAccessCache.get(user.id);
      if (cached && cached.expiresAt > Date.now()) {
        if (active) {
          setDatabaseAdmin(cached.result.isAdmin);
          setDatabaseError(cached.result.error);
          setDatabaseCheckLoading(false);
        }
        return;
      }

      setDatabaseCheckLoading(true);
      setDatabaseError(null);

      try {
        let request = adminAccessRequests.get(user.id);

        if (!request) {
          request = (async () => {
            const sessionResult = await supabase.auth.getSession();
            const accessToken = sessionResult.data.session?.access_token;

            if (!accessToken) {
              return { isAdmin: false, error: null };
            }

            const response = await fetchApi('/api/admin/access', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            const contentType = response.headers.get('content-type') ?? '';
            const isJson = contentType.includes('application/json');
            const payload = isJson ? await response.json().catch(() => null) : null;

            return {
              isAdmin: Boolean(response.ok && payload?.isAdmin === true),
              error: !isJson
                ? 'Admin service is returning the website instead of API data. Check the Node API server.'
                : response.status >= 500
                  ? payload?.error ?? 'Admin service is temporarily unavailable.'
                  : null,
            };
          })().finally(() => {
            adminAccessRequests.delete(user.id);
          });

          adminAccessRequests.set(user.id, request);
        }

        const result = await request;
        adminAccessCache.set(user.id, { expiresAt: Date.now() + ADMIN_ACCESS_CACHE_MS, result });

        if (active) {
          setDatabaseAdmin(result.isAdmin);
          setDatabaseError(result.error);
          setDatabaseCheckLoading(false);
        }
      } catch (error) {
        if (active) {
          setDatabaseAdmin(false);
          setDatabaseError(
            error instanceof DOMException && error.name === 'AbortError'
              ? 'Admin access check took too long. Refresh the page or restart the local server.'
              : error instanceof Error
                ? error.message
                : 'Admin data is not available.',
          );
          setDatabaseCheckLoading(false);
        }
      }
    }

    void loadAdminAccess();

    return () => {
      active = false;
    };
  }, [needsDatabaseCheck, user?.id]);

  return {
    isAdmin: databaseAdmin,
    loading: needsDatabaseCheck && databaseCheckLoading,
    error: databaseError,
  };
}
