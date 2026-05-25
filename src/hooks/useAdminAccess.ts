import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';

export function useAdminAccess(user: User | null) {
  const [databaseAdmin, setDatabaseAdmin] = useState(false);
  const [databaseCheckLoading, setDatabaseCheckLoading] = useState(true);
  const supabaseReady = hasSupabaseEnv();

  const metadataAdmin = user?.app_metadata?.role === 'admin' && user?.app_metadata?.admin_status !== 'revoked';
  const needsDatabaseCheck = Boolean(user && supabaseReady && !metadataAdmin);

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

      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;

      if (!accessToken) {
        if (active) {
          setDatabaseAdmin(false);
          setDatabaseCheckLoading(false);
        }
        return;
      }

      const response = await fetch('/api/admin/access', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (active) {
        setDatabaseAdmin(response.ok);
        setDatabaseCheckLoading(false);
      }
    }

    void loadAdminAccess();

    return () => {
      active = false;
    };
  }, [needsDatabaseCheck, user]);

  return {
    isAdmin: Boolean(metadataAdmin || databaseAdmin),
    loading: needsDatabaseCheck && databaseCheckLoading,
  };
}
