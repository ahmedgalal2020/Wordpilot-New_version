import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { fetchApi } from '../lib/api';

export function useAdminAccess(user: User | null) {
  const [databaseAdmin, setDatabaseAdmin] = useState(false);
  const [databaseCheckLoading, setDatabaseCheckLoading] = useState(true);
  const supabaseReady = hasSupabaseEnv();

  const needsDatabaseCheck = Boolean(user && supabaseReady);

  useEffect(() => {
    if (!needsDatabaseCheck) {
      setDatabaseAdmin(false);
      setDatabaseCheckLoading(false);
      return;
    }

    let active = true;
    setDatabaseCheckLoading(true);

    async function loadAdminAccess() {
      if (!user) return;

      try {
        const sessionResult = await supabase.auth.getSession();
        const accessToken = sessionResult.data.session?.access_token;

        if (!accessToken) {
          if (active) {
            setDatabaseAdmin(false);
            setDatabaseCheckLoading(false);
          }
          return;
        }

        const response = await fetchApi('/api/admin/access', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

        if (active) {
          setDatabaseAdmin(Boolean(response.ok && payload?.isAdmin === true));
          setDatabaseCheckLoading(false);
        }
      } catch {
        if (active) {
          setDatabaseAdmin(false);
          setDatabaseCheckLoading(false);
        }
      }
    }

    void loadAdminAccess();

    return () => {
      active = false;
    };
  }, [needsDatabaseCheck, user]);

  return {
    isAdmin: databaseAdmin,
    loading: needsDatabaseCheck && databaseCheckLoading,
  };
}
