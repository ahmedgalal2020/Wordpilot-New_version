import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bot,
  ChevronDown,
  CreditCard,
  History,
  Keyboard,
  LayoutDashboard,
  Library,
  LoaderCircle,
  LogOut,
  Menu,
  Mic2,
  Plus,
  Route,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { useI18n } from '../i18n';

type NavActivityItem = {
  id: string;
  title: string;
  meta: string;
  to: string;
  createdAt: string;
};

type NavNotificationItem = {
  id: string;
  title: string;
  body: string;
  to: string;
};

type NavItem = {
  to: string;
  labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0];
  icon: React.ElementType;
  userOnly?: boolean;
  adminOnly?: boolean;
  match?: string[];
};

const mainNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, userOnly: true },
  { to: '/practice-path', labelKey: 'nav.practicePath', icon: Route, userOnly: true, match: ['/practice-path', '/curriculum'] },
  { to: '/workspace', labelKey: 'nav.exercises', icon: Keyboard, userOnly: true },
  { to: '/shadowing', labelKey: 'nav.shadowing', icon: Mic2, userOnly: true },
  { to: '/ai-lab', labelKey: 'nav.aiLab', icon: Bot, userOnly: true },
  { to: '/pricing', labelKey: 'nav.pricing', icon: CreditCard },
  { to: '/admin', labelKey: 'nav.admin', icon: ShieldCheck, userOnly: true, adminOnly: true },
];

const practiceItems: NavItem[] = [
  { to: '/library', labelKey: 'nav.library', icon: Library, userOnly: true },
  { to: '/history', labelKey: 'nav.history', icon: History, userOnly: true },
];

const startItems = [
  { to: '/ai-lab', labelKey: 'nav.startPractice.aiText', descriptionKey: 'nav.startPractice.aiTextBody', icon: Bot },
  { to: '/workspace', labelKey: 'nav.startPractice.dictation', descriptionKey: 'nav.startPractice.dictationBody', icon: Keyboard },
  { to: '/shadowing', labelKey: 'nav.startPractice.shadowing', descriptionKey: 'nav.startPractice.shadowingBody', icon: Mic2 },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAccess(user);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [loadingQuickData, setLoadingQuickData] = useState(false);
  const [recentActivity, setRecentActivity] = useState<NavActivityItem[]>([]);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const startMenuRef = useRef<HTMLDivElement | null>(null);
  const quickHistoryLoadedForRef = useRef<string | null>(null);
  const supabaseReady = hasSupabaseEnv();
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password';
  const displayName = profile?.full_name || user?.user_metadata.full_name || user?.email?.split('@')[0] || 'Guest';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const visibleMainItems = mainNavItems.filter((item) => {
    if (item.userOnly && !user) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });
  const centerNavItems = user ? visibleMainItems : [];
  const visiblePracticeItems = practiceItems.filter((item) => !item.userOnly || user);
  const notifications = useMemo(() => {
    const items: NavNotificationItem[] = [];

    if (!supabaseReady) {
      items.push({
        id: 'sync',
        title: t('nav.notice.syncTitle'),
        body: t('nav.notice.syncBody'),
        to: '/account',
      });
    }

    if (user && !profile?.full_name?.trim()) {
      items.push({
        id: 'profile-name',
        title: t('nav.notice.profileTitle'),
        body: t('nav.notice.profileBody'),
        to: '/account',
      });
    }

    if (user && (!profile?.target_language || !profile?.cefr_level)) {
      items.push({
        id: 'learning-target',
        title: t('nav.notice.targetTitle'),
        body: t('nav.notice.targetBody'),
        to: '/practice-path',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'clear',
        title: t('nav.notice.readyTitle'),
        body: t('nav.notice.readyBody'),
        to: '/dashboard',
      });
    }

    return items.slice(0, 3);
  }, [profile?.cefr_level, profile?.full_name, profile?.target_language, supabaseReady, t, user]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!accountMenuRef.current?.contains(target)) setAccountMenuOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!historyRef.current?.contains(target)) setHistoryOpen(false);
      if (!startMenuRef.current?.contains(target)) setStartMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        setNotificationsOpen(false);
        setHistoryOpen(false);
        setStartMenuOpen(false);
        setMobileMenuOpen(false);
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
    setStartMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || !supabaseReady) {
      setRecentActivity([]);
      quickHistoryLoadedForRef.current = null;
      return;
    }

    const quickHistoryCacheKey = `${user.id}:${language}`;
    if (!historyOpen || quickHistoryLoadedForRef.current === quickHistoryCacheKey) {
      return;
    }

    let active = true;

    async function loadQuickHistory() {
      setLoadingQuickData(true);
      const [sessionsResult, savedTextsResult] = await Promise.all([
        supabase.from('dictation_sessions').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('saved_texts').select('id,title,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
      ]);

      if (!active) return;

      const sessionItems: NavActivityItem[] =
        sessionsResult.data?.map((session) => ({
          id: `session-${session.id}`,
          title: session.title || t('nav.history.dictationSession'),
          meta: `${t('nav.history.session')} - ${formatNavDate(session.created_at, language)}`,
          to: '/history',
          createdAt: session.created_at,
        })) ?? [];

      const savedTextItems: NavActivityItem[] =
        savedTextsResult.data?.map((text) => ({
          id: `text-${text.id}`,
          title: text.title || t('nav.history.savedTextFallback'),
          meta: `${t('nav.history.savedText')} - ${formatNavDate(text.created_at, language)}`,
          to: '/library',
          createdAt: text.created_at,
        })) ?? [];

      setRecentActivity([...sessionItems, ...savedTextItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
      quickHistoryLoadedForRef.current = quickHistoryCacheKey;
      setLoadingQuickData(false);
    }

    void loadQuickHistory();

    return () => {
      active = false;
    };
  }, [historyOpen, language, supabaseReady, t, user?.id]);

  async function handleSignOut() {
    setAccountMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  if (isAuthPage) {
    return (
      <header className="w-full py-8 sm:py-10">
        <div className="wp-shell flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/wordpilot-logo.svg" alt="WordPilot" className="h-10 w-auto sm:h-12" />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-surface-container bg-surface/94 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/88" aria-label={t('nav.primary')}>
      <div className="wp-shell flex h-16 items-center justify-between gap-3">
        <Link to={user ? '/dashboard' : '/'} className="flex min-w-[8.75rem] shrink-0 items-center focus:outline-none" aria-label={t('nav.home')}>
          <img src="/wordpilot-logo.svg" alt="WordPilot" className="h-9 w-auto sm:h-10" />
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className={cn('max-w-full items-center gap-1 overflow-hidden rounded-full bg-surface-container-low p-1 font-headline text-sm font-semibold tracking-tight', centerNavItems.length > 0 ? 'flex' : 'hidden')}>
            {centerNavItems.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {user && (
            <div className="relative hidden lg:block" ref={notificationsRef}>
              <IconButton
                active={notificationsOpen}
                label={t('nav.notifications.open')}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setHistoryOpen(false);
                  setAccountMenuOpen(false);
                  setStartMenuOpen(false);
                }}
              >
                <Bell className="h-5 w-5" />
              </IconButton>
              {notificationsOpen && <QuickPanel title={t('nav.notifications.title')} items={notifications} onItemClick={() => setNotificationsOpen(false)} />}
            </div>
          )}

          {user && (
            <div className="relative hidden lg:block" ref={historyRef}>
              <IconButton
                active={historyOpen}
                label={t('nav.history.open')}
                onClick={() => {
                  setHistoryOpen((open) => !open);
                  setNotificationsOpen(false);
                  setAccountMenuOpen(false);
                  setStartMenuOpen(false);
                }}
              >
                <History className="h-5 w-5" />
              </IconButton>
              {historyOpen && (
                <QuickPanel
                  title={t('nav.history.title')}
                  items={
                    loadingQuickData
                      ? []
                      : recentActivity.length > 0
                        ? recentActivity.map((item) => ({ id: item.id, title: item.title, body: item.meta, to: item.to }))
                        : [{ id: 'empty-history', title: t('nav.history.emptyTitle'), body: t('nav.history.emptyBody'), to: '/workspace' }]
                  }
                  loading={loadingQuickData}
                  onItemClick={() => setHistoryOpen(false)}
                />
              )}
            </div>
          )}

          {user ? (
            <>
              <div className="relative hidden sm:block" ref={startMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setStartMenuOpen((open) => !open);
                    setAccountMenuOpen(false);
                    setNotificationsOpen(false);
                    setHistoryOpen(false);
                  }}
                  className="primary-gradient inline-flex h-11 items-center gap-2 rounded-full px-4 font-headline text-sm font-bold text-on-primary whisper-shadow transition hover:scale-[1.02] active:scale-[0.99]"
                  aria-expanded={startMenuOpen}
                  aria-haspopup="menu"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">{t('nav.start')}</span>
                  <ChevronDown className={cn('hidden h-4 w-4 transition-transform lg:block', startMenuOpen && 'rotate-180')} />
                </button>
                {startMenuOpen && <StartMenu onItemClick={() => setStartMenuOpen(false)} />}
              </div>

              <LanguageToggle language={language} setLanguage={setLanguage} label={t('nav.language')} />

              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((open) => !open);
                    setMobileMenuOpen(false);
                    setNotificationsOpen(false);
                    setHistoryOpen(false);
                    setStartMenuOpen(false);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-container-lowest py-1 pl-1 pr-2 text-on-surface shadow-sm ring-1 ring-surface-container transition hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface sm:pr-3"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={t('nav.account.open')}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    {initials || 'U'}
                  </span>
                  <span className="hidden max-w-[7.5rem] truncate text-sm font-bold text-on-surface 2xl:block">{displayName}</span>
                  <ChevronDown className={cn('hidden h-4 w-4 text-on-surface-variant transition-transform sm:block', accountMenuOpen && 'rotate-180')} />
                </button>

                {accountMenuOpen && <AccountMenu displayName={displayName} email={user.email ?? ''} onSignOut={() => void handleSignOut()} />}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/pricing"
                className={cn(
                  'hidden rounded-full px-4 py-2.5 font-headline text-sm font-semibold transition sm:block',
                  location.pathname === '/pricing'
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
                )}
              >
                {t('nav.pricing')}
              </Link>
              <Link to="/login" className="hidden rounded-full px-4 py-2.5 font-headline text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary sm:block">
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="primary-gradient rounded-full px-4 py-2.5 font-headline text-sm font-bold text-on-primary whisper-shadow transition hover:scale-[1.02] active:scale-[0.99] sm:px-6">
                {t('nav.startFree')}
              </Link>
              <LanguageToggle language={language} setLanguage={setLanguage} label={t('nav.language')} />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setAccountMenuOpen(false);
              setNotificationsOpen(false);
              setHistoryOpen(false);
              setStartMenuOpen(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={t('nav.toggle')}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-surface-container bg-surface/98 shadow-lg lg:hidden">
          <div className="wp-shell flex max-h-[calc(100dvh-4rem)] flex-col gap-2 overflow-y-auto py-4">
            {visibleMainItems.map((item) => (
              <MobileNavLink key={item.to} item={item} />
            ))}
            {user && visiblePracticeItems.map((item) => <MobileNavLink key={item.to} item={item} />)}
            {user && (
              <MobileUtilityLink to="/account" icon={Settings} label={t('nav.account.settings')} />
            )}
            {user ? (
              <div className="mt-2 grid gap-2 rounded-3xl bg-surface-container-low p-2 sm:grid-cols-3">
                {startItems.map((item) => (
                  <MobileStartLink key={item.to} {...item} />
                ))}
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link to="/login" className="inline-flex items-center justify-center rounded-2xl bg-surface-container-low px-5 py-3 font-headline font-semibold text-on-surface">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="primary-gradient inline-flex items-center justify-center rounded-2xl px-5 py-3 font-headline font-semibold text-on-primary">
                  {t('nav.startFree')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function IconButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface',
        active ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
      )}
      aria-expanded={active}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function StartMenu({ onItemClick }: { onItemClick: () => void }) {
  const { t } = useI18n();

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[280px] rounded-[1.5rem] border border-surface-container bg-surface-container-lowest p-2 whisper-shadow">
      <div className="px-4 py-3">
        <p className="font-headline font-semibold text-on-surface">{t('nav.startPractice.title')}</p>
        <p className="mt-1 text-xs text-on-surface-variant">{t('nav.startPractice.body')}</p>
      </div>
      <div className="h-px bg-surface-container mx-2" />
      <div className="py-2">
        {startItems.map((item) => (
          <StartMenuItem key={item.to} {...item} onItemClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}

function StartMenuItem({ to, labelKey, descriptionKey, icon: Icon, onItemClick }: { key?: React.Key; to: string; labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0]; descriptionKey: Parameters<ReturnType<typeof useI18n>['t']>[0]; icon: React.ElementType; onItemClick: () => void }) {
  const { t } = useI18n();

  return (
    <Link to={to} onClick={onItemClick} className="mx-2 flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-surface-container-low">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-headline text-sm font-bold text-on-surface">{t(labelKey)}</span>
        <span className="mt-0.5 block text-xs text-on-surface-variant">{t(descriptionKey)}</span>
      </span>
    </Link>
  );
}

function MobileStartLink({ to, labelKey, descriptionKey, icon: Icon }: { key?: React.Key; to: string; labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0]; descriptionKey: Parameters<ReturnType<typeof useI18n>['t']>[0]; icon: React.ElementType }) {
  const { t } = useI18n();

  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-headline text-sm font-bold text-on-surface">{t(labelKey)}</span>
        <span className="block text-xs text-on-surface-variant">{t(descriptionKey)}</span>
      </span>
    </Link>
  );
}

function MobileUtilityLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-headline font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function AccountMenu({ displayName, email, onSignOut }: { displayName: string; email: string; onSignOut: () => void }) {
  const { t } = useI18n();

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-[240px] rounded-[1.5rem] border border-surface-container bg-surface-container-lowest p-2 whisper-shadow">
      <div className="px-4 py-3">
        <p className="font-headline font-semibold text-on-surface">{displayName}</p>
        <p className="max-w-[12rem] truncate text-sm text-on-surface-variant">{email}</p>
      </div>
      <div className="h-px bg-surface-container mx-2" />
      <Link to="/account" className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 font-headline font-semibold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary">
        <Settings className="h-4 w-4" />
        {t('nav.account.settings')}
      </Link>
      <button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-headline font-semibold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary">
        <LogOut className="h-4 w-4" />
        {t('nav.account.signOut')}
      </button>
    </div>
  );
}

function LanguageToggle({
  language,
  setLanguage,
  label,
}: {
  language: 'en' | 'de';
  setLanguage: (language: 'en' | 'de') => void;
  label: string;
}) {
  return (
    <div className="hidden items-center rounded-full bg-surface-container-low p-1 sm:flex" aria-label={label}>
      {(['en', 'de'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={cn(
            'h-8 rounded-full px-3 text-[11px] font-black uppercase tracking-wider transition',
            language === option ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
          )}
          aria-pressed={language === option}
        >
          {option}
        </button>
      ))}
    </div>
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
            <Link key={item.id} to={item.to} onClick={onItemClick} className="mx-2 flex rounded-2xl px-4 py-3 transition hover:bg-surface-container-low">
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

function formatNavDate(value: string, language: 'en' | 'de') {
  return new Date(value).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function NavLink({ item }: { key?: React.Key; item: NavItem }) {
  const location = useLocation();
  const { t } = useI18n();
  const isActive = item.match?.includes(location.pathname) ?? location.pathname === item.to;

  return (
    <Link
      to={item.to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center rounded-full px-3 text-[13px] transition-colors xl:px-4 xl:text-sm',
        isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
      )}
    >
      <span>{t(item.labelKey)}</span>
    </Link>
  );
}

function MobileNavLink({ item }: { key?: React.Key; item: NavItem }) {
  const location = useLocation();
  const { t } = useI18n();
  const isActive = item.match?.includes(location.pathname) ?? location.pathname === item.to;
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 font-headline font-semibold transition-colors',
        isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
      )}
    >
      <Icon className="h-5 w-5" />
      {t(item.labelKey)}
    </Link>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-surface w-full border-t border-surface-container py-10 sm:py-12">
      <div className="wp-shell grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <img src="/wordpilot-logo.svg" alt="WordPilot" className="h-9 w-auto" />
          <p className="text-xs tracking-wide leading-relaxed text-on-surface-variant max-w-xs">
            Copyright 2026 WordPilot. {t('footer.rights')}
          </p>
        </div>
        <div className="flex flex-wrap justify-start md:justify-end gap-x-8 gap-y-4 text-xs tracking-wide leading-relaxed text-on-surface-variant">
          <Link to="/privacy" className="hover:text-primary transition-colors">{t('title.privacy').replace(' | WordPilot', '')}</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">{t('title.terms').replace(' | WordPilot', '')}</Link>
          <Link to="/help" className="hover:text-primary transition-colors">{t('title.help').replace(' | WordPilot', '')}</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">{t('title.contact').replace(' | WordPilot', '')}</Link>
        </div>
      </div>
    </footer>
  );
}







