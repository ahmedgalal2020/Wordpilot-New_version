import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { fetchApi } from '../lib/api';

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
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    setDatabaseCheckLoading(true);
    setDatabaseError(null);

    async function loadAdminAccess() {
      if (!user) return;

      try {
        const sessionResult = await supabase.auth.getSession();
        const accessToken = sessionResult.data.session?.access_token;

        if (!accessToken) {
          if (active) {
            setDatabaseAdmin(false);
            setDatabaseError(null);
            setDatabaseCheckLoading(false);
          }
          return;
        }

        const response = await fetchApi('/api/admin/access', {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const contentType = response.headers.get('content-type') ?? '';
        const isJson = contentType.includes('application/json');
        const payload = isJson ? await response.json().catch(() => null) : null;

        if (active) {
          setDatabaseAdmin(Boolean(response.ok && payload?.isAdmin === true));
          setDatabaseError(
            !isJson
              ? 'Admin service is returning the website instead of API data. Check the Netlify Function deploy.'
              : response.status >= 500
                ? payload?.error ?? 'Admin service is temporarily unavailable.'
                : null,
          );
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
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [needsDatabaseCheck, user]);

  return {
    isAdmin: databaseAdmin,
    loading: needsDatabaseCheck && databaseCheckLoading,
    error: databaseError,
  };
}
