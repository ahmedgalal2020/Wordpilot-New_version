import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, History, LoaderCircle, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { useAdminAccess } from '../hooks/useAdminAccess';

type NavActivityItem = {
  id: string;
  title: string;
  meta: string;
  to: string;
};

type NavNotificationItem = {
  id: string;
  title: string;
  body: string;
  to: string;
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingQuickData, setLoadingQuickData] = useState(false);
  const [recentActivity, setRecentActivity] = useState<NavActivityItem[]>([]);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const supabaseReady = hasSupabaseEnv();
  const { isAdmin } = useAdminAccess(user);
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password';
  const displayName = profile?.full_name || user?.user_metadata.full_name || user?.email?.split('@')[0] || 'Guest';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const notifications = useMemo(() => {
    const items: NavNotificationItem[] = [];

    if (!supabaseReady) {
      items.push({
        id: 'supabase',
        title: 'Data sync is not connected',
        body: 'Connect Supabase to unlock live history, certificates, and account syncing.',
        to: '/account',
      });
    }

    if (!profile?.full_name?.trim()) {
      items.push({
        id: 'profile-name',
        title: 'Complete your profile',
        body: 'Add your full name in Account so certificates and saved data look cleaner.',
        to: '/account',
      });
    }

    if (!profile?.target_language || !profile?.cefr_level) {
      items.push({
        id: 'learning-target',
        title: 'Set your learning target',
        body: 'Choose your target language and CEFR level to keep AI Lab and Exercises aligned.',
        to: '/account',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'clear',
        title: 'You are all caught up',
        body: 'No pending account or setup actions right now.',
        to: '/dashboard',
      });
    }

    return items.slice(0, 3);
  }, [profile?.cefr_level, profile?.full_name, profile?.target_language, supabaseReady]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (!historyRef.current?.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        setNotificationsOpen(false);
        setHistoryOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setHistoryOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || !supabaseReady) {
      setRecentActivity([]);
      return;
    }

    let active = true;

    async function loadQuickHistory() {
      setLoadingQuickData(true);
      const [sessionsResult, savedTextsResult] = await Promise.all([
        supabase.from('dictation_sessions').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('saved_texts').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
      ]);

      if (!active) {
        return;
      }

      const sessionItems: NavActivityItem[] =
        sessionsResult.data?.map((session) => ({
          id: `session-${session.id}`,
          title: session.title,
          meta: `Session - ${formatNavDate(session.created_at)}`,
          to: '/history',
        })) ?? [];

      const savedTextItems: NavActivityItem[] =
        savedTextsResult.data?.map((text) => ({
          id: `text-${text.id}`,
          title: text.title,
          meta: `Saved text - ${formatNavDate(text.created_at)}`,
          to: '/library',
        })) ?? [];

      setRecentActivity([...sessionItems, ...savedTextItems].sort((a, b) => a.meta < b.meta ? 1 : -1).slice(0, 5));
      setLoadingQuickData(false);
    }

    void loadQuickHistory();

    return () => {
      active = false;
    };
  }, [supabaseReady, user]);

  async function handleSignOut() {
    setAccountMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  if (isAuthPage) {
    return (
      <header className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex justify-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl sm:text-2xl font-black tracking-tighter text-primary font-headline">WordPilot</div>
        </Link>
      </header>
    );
  }

  return (
    <nav className="bg-surface fixed top-0 w-full z-50 border-b border-surface-container">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto gap-3">
        <Link to="/" className="text-lg sm:text-2xl font-black tracking-tighter text-primary font-headline shrink-0">
          WordPilot
        </Link>

        <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-headline font-semibold tracking-tight">
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && <NavLink to="/practice-path">Practice Path</NavLink>}
          {user && <NavLink to="/workspace">Exercises</NavLink>}
          {user && <NavLink to="/ai-lab">AI Lab</NavLink>}
          <NavLink to="/pricing">Pricing</NavLink>
          {user && isAdmin && <NavLink to="/admin">Admin</NavLink>}
          {user && <NavLink to="/account">Account</NavLink>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden lg:block relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setHistoryOpen(false);
                  setAccountMenuOpen(false);
                }}
                className="inline-flex p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all"
                aria-expanded={notificationsOpen}
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              {notificationsOpen && (
                <QuickPanel
                  title="Notifications"
                  items={notifications}
                  onItemClick={() => setNotificationsOpen(false)}
                />
              )}
            </div>
          )}

          {user && (
            <div className="hidden lg:block relative" ref={historyRef}>
              <button
                type="button"
                onClick={() => {
                  setHistoryOpen((open) => !open);
                  setNotificationsOpen(false);
                  setAccountMenuOpen(false);
                }}
                className="inline-flex p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all"
                aria-expanded={historyOpen}
                aria-label="Open recent activity"
              >
                <History className="w-5 h-5" />
              </button>
              {historyOpen && (
                <QuickPanel
                  title="Recent Activity"
                  items={
                    loadingQuickData
                      ? []
                      : recentActivity.length > 0
                        ? recentActivity.map((item) => ({
                            id: item.id,
                            title: item.title,
                            body: item.meta,
                            to: item.to,
                          }))
                        : [
                            {
                              id: 'empty-history',
                              title: 'No recent activity yet',
                              body: 'Your latest sessions and saved texts will appear here.',
                              to: '/workspace',
                            },
                          ]
                  }
                  loading={loadingQuickData}
                  onItemClick={() => setHistoryOpen(false)}
                />
              )}
            </div>
          )}

          {user ? (
            <>
              <Link to="/workspace" className="hidden sm:inline-flex primary-gradient text-on-primary font-headline font-semibold px-4 lg:px-6 py-2 rounded-full scale-95 active:opacity-80 transition-transform duration-200 text-sm lg:text-base">
                Start New
              </Link>
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary pl-1 pr-3 py-1 shadow-sm transition hover:bg-primary-dim"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                >
                  <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                    {initials}
                  </span>
                  <ChevronDown className={cn('hidden sm:block w-4 h-4 transition-transform', accountMenuOpen && 'rotate-180')} />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-[220px] rounded-[1.5rem] border border-surface-container bg-surface-container-lowest p-2 whisper-shadow">
                    <div className="px-4 py-3">
                      <p className="font-headline font-semibold text-on-surface">{displayName}</p>
                      <p className="text-sm text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <div className="h-px bg-surface-container mx-2" />
                    <Link
                      to="/account"
                      className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-on-surface-variant font-headline font-semibold transition hover:bg-surface-container-low hover:text-primary"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-on-surface-variant font-headline font-semibold transition hover:bg-surface-container-low hover:text-primary"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-on-surface-variant font-headline font-semibold px-4 py-2 hover:bg-surface-container rounded-lg transition-all">
                Login
              </Link>
              <Link to="/signup" className="primary-gradient text-on-primary font-headline font-semibold px-4 sm:px-6 py-2 rounded-full scale-95 active:opacity-80 transition-transform duration-200 text-sm sm:text-base">
                Start Free
              </Link>
              <div className="hidden sm:flex w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden items-center justify-center text-on-surface-variant">
                <User className="w-4 h-4" />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-on-surface hover:bg-surface-container transition-all"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-container bg-surface">
          <div className="px-4 sm:px-6 py-4 max-w-[1440px] mx-auto flex flex-col gap-2">
            {user && <MobileNavLink to="/dashboard">Dashboard</MobileNavLink>}
            {user && <MobileNavLink to="/practice-path">Practice Path</MobileNavLink>}
            {user && <MobileNavLink to="/workspace">Exercises</MobileNavLink>}
            {user && <MobileNavLink to="/ai-lab">AI Lab</MobileNavLink>}
            <MobileNavLink to="/pricing">Pricing</MobileNavLink>
            {user && isAdmin && <MobileNavLink to="/admin">Admin</MobileNavLink>}
            {user && <MobileNavLink to="/account">Account</MobileNavLink>}
            {user ? (
              <Link to="/workspace" className="mt-2 inline-flex items-center justify-center rounded-2xl primary-gradient text-on-primary font-headline font-semibold px-5 py-3">
                Start New
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link to="/login" className="inline-flex items-center justify-center rounded-2xl bg-surface-container-low text-on-surface font-headline font-semibold px-5 py-3">
                  Login
                </Link>
                <Link to="/signup" className="inline-flex items-center justify-center rounded-2xl primary-gradient text-on-primary font-headline font-semibold px-5 py-3">
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function QuickPanel({
  title,
  items,
  loading,
  onItemClick,
}: {
  title: string;
  items: Array<{ id: string; title: string; body: string; to: string }>;
  loading?: boolean;
  onItemClick: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[320px] rounded-[1.5rem] border border-surface-container bg-surface-container-lowest p-2 whisper-shadow">
      <div className="px-4 py-3">
        <p className="font-headline font-semibold text-on-surface">{title}</p>
      </div>
      <div className="h-px bg-surface-container mx-2" />
      <div className="max-h-[360px] overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-8 flex items-center justify-center text-on-surface-variant">
            <LoaderCircle className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              onClick={onItemClick}
              className="mx-2 flex rounded-2xl px-4 py-3 transition hover:bg-surface-container-low"
            >
              <div>
                <p className="font-headline font-semibold text-sm text-on-surface">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{item.body}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function formatNavDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        'transition-colors',
        isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary',
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        'rounded-2xl px-4 py-3 font-headline font-semibold transition-colors',
        isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
      )}
    >
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-surface w-full py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-surface-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-[1440px] mx-auto">
        <div className="space-y-4">
          <div className="font-headline font-bold text-on-surface text-xl">WordPilot</div>
          <p className="text-xs tracking-wide leading-relaxed text-on-surface-variant max-w-xs">
            Copyright 2026 WordPilot. Built by Eng.Ahmed Hassan.
          </p>
        </div>
        <div className="flex flex-wrap justify-start md:justify-end gap-x-8 gap-y-4 text-xs tracking-wide leading-relaxed text-on-surface-variant">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/help" className="hover:text-primary transition-colors">Help Center</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}
