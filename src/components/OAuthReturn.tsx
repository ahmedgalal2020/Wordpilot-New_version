import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { readOAuthFailure, withAuthDeadline } from '../lib/oauthRecovery';

/** Supabase initializes the implicit session; this boundary handles failed returns. */
export function OAuthReturn({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const failure = readOAuthFailure(location.search, location.hash);
    const callback = new URLSearchParams(location.search).get('oauth') === 'callback';
    if (!failure && !callback) return;
    let active = true;
    const fail = (reason: 'cancelled' | 'error') => {
      if (active) navigate('/login', { replace: true, state: { oauthFailure: reason } });
    };
    if (failure) {
      fail(failure);
    } else {
      void withAuthDeadline(supabase.auth.getSession())
        .then(({ data, error }) => {
          if (!active) return;
          if (error || !data.session) fail('error');
          else navigate('/dashboard', { replace: true });
        })
        .catch(() => fail('error'));
    }
    return () => { active = false; };
  }, [location.search, location.hash, navigate]);
  const returning = readOAuthFailure(location.search, location.hash) ||
    new URLSearchParams(location.search).get('oauth') === 'callback';
  return returning ? <main aria-busy="true" className="min-h-[60vh]" /> : children;
}
