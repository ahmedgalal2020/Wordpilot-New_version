import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getAppRedirectUrl, getMissingClientEnv, hasSupabaseEnv } from '../lib/env';
import { supabase } from '../lib/supabase';

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  target_language: string | null;
  cefr_level: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  authMessage: string | null;
  sessionSecurity: {
    idleWarningVisible: boolean;
    secondsUntilSignOut: number;
    continueSession: () => Promise<void>;
    signOutNow: () => Promise<void>;
  };
  signIn: (email: string, password: string) => Promise<{ error: string | null; success: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsEmailVerification: boolean }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null; message: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null; message: string | null }>;
  changePassword: (password: string) => Promise<{ error: string | null; message: string | null }>;
  sendPasswordChangeCode: (currentPassword: string) => Promise<{ error: string | null; message: string | null }>;
  changePasswordWithCode: (password: string, code?: string) => Promise<{ error: string | null; message: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: Partial<UserProfile>) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const DEFAULT_IDLE_WARNING_SECONDS = 120;
const SESSION_HEALTH_CHECK_MS = 5 * 60 * 1000;

function getSessionSecurityConfig() {
  const configuredTimeout = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES ?? DEFAULT_IDLE_TIMEOUT_MINUTES);
  const configuredWarning = Number(import.meta.env.VITE_IDLE_WARNING_SECONDS ?? DEFAULT_IDLE_WARNING_SECONDS);
  const idleTimeoutMs =
    Number.isFinite(configuredTimeout) && configuredTimeout >= 5
      ? configuredTimeout * 60 * 1000
      : DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;
  const warningMs =
    Number.isFinite(configuredWarning) && configuredWarning >= 30
      ? configuredWarning * 1000
      : DEFAULT_IDLE_WARNING_SECONDS * 1000;

  return {
    idleTimeoutMs,
    warningMs: Math.min(warningMs, idleTimeoutMs - 30_000),
  };
}

function buildAuthMessage() {
  if (hasSupabaseEnv()) {
    return null;
  }

  const missingKeys = getMissingClientEnv().map((key) =>
    key === 'supabaseUrl' ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY',
  );

  return `Authentication is not configured yet. Add ${missingKeys.join(' and ')} to .env.local, then restart the app.`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idleWarningVisible, setIdleWarningVisible] = useState(false);
  const [secondsUntilSignOut, setSecondsUntilSignOut] = useState(0);
  const lastActivityRef = useRef(Date.now());

  const authReady = hasSupabaseEnv();
  const authMessage = buildAuthMessage();

  function clearAuthHashFromUrl() {
    if (typeof window === 'undefined') {
      return;
    }

    const authHashMarkers = ['access_token=', 'refresh_token=', 'expires_in=', 'token_type='];
    const hasAuthHash = authHashMarkers.some((marker) => window.location.hash.includes(marker));
    const isRecoveryFlow = window.location.hash.includes('type=recovery');

    if (isRecoveryFlow) {
      window.sessionStorage.setItem('wordpilot-recovery-flow', 'ready');
    }

    if (hasAuthHash) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }

  function clearStoredAuthSession() {
    if (typeof window === 'undefined') {
      return;
    }

    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  }

  async function ensureProfile(currentUser: User) {
    const payload = {
      id: currentUser.id,
      email: currentUser.email ?? null,
      full_name: currentUser.user_metadata.full_name ?? null,
      avatar_url: currentUser.user_metadata.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    return { error };
  }

  async function fetchProfile(currentUser: User | null) {
    if (!authReady || !currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error || !data) {
      await ensureProfile(currentUser);

      const { data: retriedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (retriedProfile) {
        setProfile(retriedProfile);
        return;
      }

      setProfile({
        id: currentUser.id,
        email: currentUser.email ?? null,
        full_name: currentUser.user_metadata.full_name ?? null,
        avatar_url: currentUser.user_metadata.avatar_url ?? null,
        target_language: null,
        cefr_level: null,
        is_blocked: false,
        blocked_reason: null,
        blocked_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    if (!authReady) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadingTimeout = window.setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1500);

    async function bootstrapAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);
        lastActivityRef.current = Date.now();
        await fetchProfile(data.session?.user ?? null);
        clearAuthHashFromUrl();
      } catch (error) {
        console.error('Failed to initialize auth session', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      lastActivityRef.current = Date.now();
      setIdleWarningVisible(false);
      setSecondsUntilSignOut(0);
      clearAuthHashFromUrl();
      setLoading(false);

      // Avoid awaiting Supabase calls inside onAuthStateChange to prevent auth deadlocks.
      window.setTimeout(() => {
        void fetchProfile(nextSession?.user ?? null).catch((error) => {
          console.error('Failed during deferred auth state sync', error);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [authReady]);

  useEffect(() => {
    if (!authReady || !session) {
      setIdleWarningVisible(false);
      setSecondsUntilSignOut(0);
      lastActivityRef.current = Date.now();
      return;
    }

    const { idleTimeoutMs, warningMs } = getSessionSecurityConfig();
    const warningStartsAtMs = idleTimeoutMs - warningMs;
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange'];

    function markActivity() {
      if (document.visibilityState === 'hidden' || idleWarningVisible) {
        return;
      }

      lastActivityRef.current = Date.now();
    }

    const idleInterval = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const remainingMs = Math.max(0, idleTimeoutMs - idleMs);

      if (idleMs >= idleTimeoutMs) {
        void signOut();
        setIdleWarningVisible(false);
        setSecondsUntilSignOut(0);
        return;
      }

      if (idleMs >= warningStartsAtMs) {
        setIdleWarningVisible(true);
        setSecondsUntilSignOut(Math.ceil(remainingMs / 1000));
        return;
      }

      setIdleWarningVisible(false);
      setSecondsUntilSignOut(0);
    }, 1000);

    const healthInterval = window.setInterval(() => {
      void verifySessionHealth();
    }, SESSION_HEALTH_CHECK_MS);

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    return () => {
      window.clearInterval(idleInterval);
      window.clearInterval(healthInterval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [authReady, idleWarningVisible, session]);

  async function verifySessionHealth() {
    if (!authReady || !session) {
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    const errorText = error?.message?.toLowerCase() ?? '';
    const sessionInvalid =
      errorText.includes('jwt') ||
      errorText.includes('expired') ||
      errorText.includes('invalid') ||
      errorText.includes('session') ||
      (!error && !data.user);

    if (sessionInvalid) {
      await signOut();
    }
  }

  async function continueSession() {
    if (!authReady) {
      return;
    }

    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      await signOut();
      return;
    }

    lastActivityRef.current = Date.now();
    setIdleWarningVisible(false);
    setSecondsUntilSignOut(0);
    setSession(data.session);
    setUser(data.session.user);
    await fetchProfile(data.session.user);
  }

  async function signIn(email: string, password: string) {
    if (!authReady) {
      return { error: authMessage, success: false };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      await ensureProfile(data.user);
    }

    return { error: error?.message ?? null, success: !error };
  }

  async function signInWithGoogle() {
    if (!authReady) {
      return { error: authMessage };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAppRedirectUrl('/dashboard'),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (!authReady) {
      return { error: authMessage, needsEmailVerification: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: getAppRedirectUrl('/dashboard'),
      },
    });

    if (error) {
      return { error: error.message, needsEmailVerification: false };
    }

    const currentUser = data.user;
    if (currentUser && data.session) {
      await ensureProfile({
        ...currentUser,
        user_metadata: {
          ...currentUser.user_metadata,
          full_name: fullName,
        },
      });
    }

    return { error: null, needsEmailVerification: !data.session };
  }

  async function resendConfirmation(email: string) {
    if (!authReady) {
      return { error: authMessage, message: null };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAppRedirectUrl('/dashboard'),
      },
    });

    if (error) {
      return { error: error.message, message: null };
    }

    return {
      error: null,
      message: 'Confirmation email sent again. Check your inbox and spam folder.',
    };
  }

  async function resetPassword(email: string) {
    if (!authReady) {
      return { error: authMessage, message: null };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAppRedirectUrl('/reset-password'),
    });

    if (error) {
      return { error: error.message, message: null };
    }

    return {
      error: null,
      message: 'Password reset email sent. Check your inbox and spam folder.',
    };
  }

  async function changePassword(password: string) {
    if (!authReady) {
      return { error: authMessage, message: null };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message, message: null };
    }

    return { error: null, message: 'Password updated successfully.' };
  }

  async function sendPasswordChangeCode(currentPassword: string) {
    if (!authReady) {
      return { error: authMessage, message: null };
    }

    if (!user?.email) {
      return { error: 'You need to be signed in with a valid email to change your password.', message: null };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { error: 'Current password is incorrect.', message: null };
    }

    const { error } = await supabase.auth.reauthenticate();

    if (error) {
      return { error: error.message, message: null };
    }

    return {
      error: null,
      message: 'A verification code was sent to your email. Enter it below to confirm the password change.',
    };
  }

  async function changePasswordWithCode(password: string, code?: string) {
    if (!authReady) {
      return { error: authMessage, message: null };
    }

    const payload = code?.trim()
      ? {
          password,
          nonce: code.trim(),
        }
      : { password };

    let result = await supabase.auth.updateUser(payload);

    if (result.error && code?.trim()) {
      const message = result.error.message.toLowerCase();
      const nonceNotRequired =
        message.includes('nonce') ||
        message.includes('reauthentication') ||
        message.includes('secure password change');

      if (nonceNotRequired) {
        result = await supabase.auth.updateUser({ password });
      }
    }

    if (result.error) {
      return { error: result.error.message, message: null };
    }

    return { error: null, message: 'Password updated successfully.' };
  }

  async function signOut() {
    if (!authReady) {
      return;
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setIdleWarningVisible(false);
    setSecondsUntilSignOut(0);
    clearAuthHashFromUrl();
    clearStoredAuthSession();

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Failed to sign out cleanly', error);
    }
  }

  async function refreshProfile() {
    await fetchProfile(user);
  }

  async function updateProfile(input: Partial<UserProfile>) {
    if (!authReady || !user) {
      return { error: 'You need to be signed in to update the profile.' };
    }

    const payload = {
      id: user.id,
      email: user.email ?? profile?.email ?? null,
      full_name: input.full_name ?? profile?.full_name ?? null,
      avatar_url: input.avatar_url ?? profile?.avatar_url ?? null,
      target_language: input.target_language ?? profile?.target_language ?? null,
      cefr_level: input.cefr_level ?? profile?.cefr_level ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload);

    if (error) {
      return { error: error.message };
    }

    await fetchProfile(user);
    return { error: null };
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      authReady,
      authMessage,
      sessionSecurity: {
        idleWarningVisible,
        secondsUntilSignOut,
        continueSession,
        signOutNow: signOut,
      },
      signIn,
      signInWithGoogle,
      signUp,
      resendConfirmation,
      resetPassword,
      changePassword,
      sendPasswordChangeCode,
      changePasswordWithCode,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [session, user, profile, loading, authReady, authMessage, idleWarningVisible, secondsUntilSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
