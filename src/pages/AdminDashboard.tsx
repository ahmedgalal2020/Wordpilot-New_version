import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Ban,
  BookOpen,
  Crown,
  CreditCard,
  DollarSign,
  FileText,
  Gauge,
  KeyRound,
  Languages,
  ListChecks,
  LoaderCircle,
  Mic2,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';
import { hasSupabaseEnv } from '../lib/env';
import { isPaidBillingInvoice } from '../lib/entitlements';
import { useI18n } from '../i18n';

type AdminOverview = {
  generatedAt: string;
  admin: {
    email: string;
    role?: string;
  };
  metrics: {
    users: number;
    subscriptions: number;
    activeSubscriptions: number;
    paidInvoices: number;
    revenueCents: number;
    revenueLast30DaysCents: number;
    sessions: number;
    savedTexts: number;
    certificates: number;
    shadowingSessions: number;
    shadowingAttempts: number;
    aiGenerations: number;
    onboardingCompleted: number;
    incompleteProfiles: number;
  };
  recentUsers: AdminUserRow[];
  recentInvoices: AdminInvoiceRow[];
  recentSessions: AdminSessionRow[];
  recentShadowingSessions: AdminShadowingSessionRow[];
  recentUsageEvents: AdminUsageEventRow[];
  incompleteProfiles: AdminUserSetupRow[];
  adminUsers: AdminUserAccessRow[];
  userSearch: string;
  billingSummary: BillingSummary;
  aiUsageSummary: AiUsageSummary;
  warnings?: string[];
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  target_language: string | null;
  cefr_level: string | null;
  plan?: AdminUserPlan;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminUserAccessRow = {
  user_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  revoked_at: string | null;
};

type AdminInvoiceRow = {
  id: string;
  user_id: string;
  label: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  issued_at: string;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
};

type AdminSessionRow = {
  id: string;
  user_id: string;
  title: string | null;
  language: string | null;
  accuracy: number | null;
  created_at: string;
};

type AdminUserPlan = {
  name: string;
  status: string;
  billingCycle: string | null;
  amountCents: number;
  currency: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type AdminShadowingSessionRow = {
  id: string;
  user_id: string;
  title: string | null;
  language: string | null;
  cefr_level: string | null;
  average_score: number | null;
  best_score: number | null;
  completed_segments: number | null;
  total_segments: number | null;
  status: string | null;
  updated_at: string;
};

type AdminUsageEventRow = {
  id: string;
  user_id: string;
  feature_key: string;
  event_type: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type AdminUserSetupRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  target_language: string | null;
  cefr_level: string | null;
};

type BillingSummary = {
  today: BillingPeriodSummary;
  yesterday: BillingPeriodSummary;
  periods: BillingPeriods;
  charts: BillingCharts;
  last30Days: BillingChartRow[];
  recentPayers: {
    today: BillingPayer[];
    yesterday: BillingPayer[];
  };
};

type BillingPeriodKey = 'today' | 'last7Days' | 'last30Days' | 'monthToDate' | 'allTime';

type BillingChartKey = 'daily' | 'weekly' | 'monthly';

type BillingPeriods = Record<BillingPeriodKey | 'yesterday', BillingPeriodSummary>;

type BillingCharts = Record<BillingChartKey, BillingChartRow[]>;

type BillingPeriodSummary = {
  paidInvoices: number;
  revenueCents: number;
};

type BillingChartRow = {
  date: string;
  label: string;
  paidInvoices: number;
  revenueCents: number;
};

type BillingPayer = {
  userId?: string | null;
  name?: string | null;
  email: string | null;
  amountCents: number;
  currency: string;
  paidAt: string | null;
  label: string | null;
};

type AiUsageSummary = {
  provider: string;
  model: string;
  currency: string;
  estimatedCostPerGenerationCents: number;
  today: AiUsagePeriodSummary;
  last7Days: AiUsagePeriodSummary;
  last30Days: AiUsagePeriodSummary;
  allTime: AiUsagePeriodSummary;
};

type AiUsagePeriodSummary = {
  generations: number;
  estimatedCostCents: number;
};

const EMPTY_BILLING_PERIOD: BillingPeriodSummary = {
  paidInvoices: 0,
  revenueCents: 0,
};

const EMPTY_BILLING_SUMMARY: BillingSummary = {
  today: EMPTY_BILLING_PERIOD,
  yesterday: EMPTY_BILLING_PERIOD,
  periods: {
    today: EMPTY_BILLING_PERIOD,
    yesterday: EMPTY_BILLING_PERIOD,
    last7Days: EMPTY_BILLING_PERIOD,
    last30Days: EMPTY_BILLING_PERIOD,
    monthToDate: EMPTY_BILLING_PERIOD,
    allTime: EMPTY_BILLING_PERIOD,
  },
  charts: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  last30Days: [],
  recentPayers: {
    today: [],
    yesterday: [],
  },
};

const EMPTY_AI_USAGE_PERIOD: AiUsagePeriodSummary = {
  generations: 0,
  estimatedCostCents: 0,
};

const EMPTY_AI_USAGE_SUMMARY: AiUsageSummary = {
  provider: 'Gemini',
  model: 'gemini-2.5-flash',
  currency: 'usd',
  estimatedCostPerGenerationCents: 0.1,
  today: EMPTY_AI_USAGE_PERIOD,
  last7Days: EMPTY_AI_USAGE_PERIOD,
  last30Days: EMPTY_AI_USAGE_PERIOD,
  allTime: EMPTY_AI_USAGE_PERIOD,
};

const BILLING_PERIOD_OPTIONS: Array<{ key: BillingPeriodKey; labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0] }> = [
  { key: 'today', labelKey: 'period.today' },
  { key: 'last7Days', labelKey: 'period.last7Days' },
  { key: 'last30Days', labelKey: 'period.last30Days' },
  { key: 'monthToDate', labelKey: 'period.monthToDate' },
  { key: 'allTime', labelKey: 'period.allTime' },
];

const BILLING_CHART_OPTIONS: Array<{ key: BillingChartKey; labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0] }> = [
  { key: 'daily', labelKey: 'chart.daily' },
  { key: 'weekly', labelKey: 'chart.weekly' },
  { key: 'monthly', labelKey: 'chart.monthly' },
];

function normalizeBillingSummary(
  summary: Partial<BillingSummary> | null | undefined,
  invoices: AdminInvoiceRow[] = [],
  users: AdminUserRow[] = [],
): BillingSummary {
  const hasServerSummary = Boolean(summary?.today || summary?.yesterday || summary?.last30Days || summary?.recentPayers);
  if (!hasServerSummary) {
    return buildBillingSummaryFromInvoices(invoices, users);
  }

  return {
    today: summary?.today ?? EMPTY_BILLING_PERIOD,
    yesterday: summary?.yesterday ?? EMPTY_BILLING_PERIOD,
    periods: {
      today: summary?.periods?.today ?? summary?.today ?? EMPTY_BILLING_PERIOD,
      yesterday: summary?.periods?.yesterday ?? summary?.yesterday ?? EMPTY_BILLING_PERIOD,
      last7Days: summary?.periods?.last7Days ?? EMPTY_BILLING_PERIOD,
      last30Days: summary?.periods?.last30Days ?? EMPTY_BILLING_PERIOD,
      monthToDate: summary?.periods?.monthToDate ?? EMPTY_BILLING_PERIOD,
      allTime: summary?.periods?.allTime ?? EMPTY_BILLING_PERIOD,
    },
    charts: {
      daily: Array.isArray(summary?.charts?.daily) ? summary.charts.daily : Array.isArray(summary?.last30Days) ? summary.last30Days : [],
      weekly: Array.isArray(summary?.charts?.weekly) ? summary.charts.weekly : [],
      monthly: Array.isArray(summary?.charts?.monthly) ? summary.charts.monthly : [],
    },
    last30Days: Array.isArray(summary?.last30Days) ? summary.last30Days : [],
    recentPayers: {
      today: Array.isArray(summary?.recentPayers?.today) ? summary.recentPayers.today : [],
      yesterday: Array.isArray(summary?.recentPayers?.yesterday) ? summary.recentPayers.yesterday : [],
    },
  };
}

function buildBillingSummaryFromInvoices(invoices: AdminInvoiceRow[], users: AdminUserRow[]): BillingSummary {
  const userMap = new Map(users.map((user) => [user.id, user]));
  const paidInvoices = invoices.filter((invoice) => isPaidBillingInvoice(invoice));
  const todayKey = getLocalDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  const last30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return {
      date: getLocalDateKey(date),
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      paidInvoices: 0,
      revenueCents: 0,
    };
  });
  const chartByDate = new Map(last30Days.map((row) => [row.date, row]));

  const todayPayers: BillingPayer[] = [];
  const yesterdayPayers: BillingPayer[] = [];

  for (const invoice of paidInvoices) {
    const paidDate = invoice.paid_at ?? invoice.issued_at;
    const dateKey = getLocalDateKey(new Date(paidDate));
    const amountCents = invoice.amount_cents ?? 0;
    const chartRow = chartByDate.get(dateKey);
    if (chartRow) {
      chartRow.paidInvoices += 1;
      chartRow.revenueCents += amountCents;
    }

    if (dateKey === todayKey || dateKey === yesterdayKey) {
      const user = userMap.get(invoice.user_id);
      const payer: BillingPayer = {
        userId: invoice.user_id ?? null,
        name: user?.full_name || user?.email || shortId(invoice.user_id),
        email: user?.email ?? null,
        amountCents,
        currency: invoice.currency ?? 'USD',
        paidAt: paidDate,
        label: invoice.label,
      };
      if (dateKey === todayKey) {
        todayPayers.push(payer);
      } else {
        yesterdayPayers.push(payer);
      }
    }
  }

  return {
    today: summarizeChartRow(chartByDate.get(todayKey)),
    yesterday: summarizeChartRow(chartByDate.get(yesterdayKey)),
    periods: {
      today: summarizeChartRow(chartByDate.get(todayKey)),
      yesterday: summarizeChartRow(chartByDate.get(yesterdayKey)),
      last7Days: summarizeBillingRows(last30Days.slice(-7)),
      last30Days: summarizeBillingRows(last30Days),
      monthToDate: summarizeBillingRows(last30Days.filter((row) => row.date.startsWith(todayKey.slice(0, 7)))),
      allTime: summarizeBillingRows(last30Days),
    },
    charts: {
      daily: last30Days,
      weekly: groupBillingRows(last30Days, 7),
      monthly: groupBillingRows(last30Days, 30),
    },
    last30Days,
    recentPayers: {
      today: todayPayers,
      yesterday: yesterdayPayers,
    },
  };
}

function summarizeChartRow(row?: BillingChartRow): BillingPeriodSummary {
  return {
    paidInvoices: row?.paidInvoices ?? 0,
    revenueCents: row?.revenueCents ?? 0,
  };
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeAdminOverview(payload: Partial<AdminOverview>): AdminOverview {
  const metrics = payload.metrics ?? ({} as Partial<AdminOverview['metrics']>);

  return {
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
    admin: {
      email: payload.admin?.email ?? '',
      role: payload.admin?.role ?? 'admin',
    },
    metrics: {
      users: metrics.users ?? 0,
      subscriptions: metrics.subscriptions ?? 0,
      activeSubscriptions: metrics.activeSubscriptions ?? 0,
      paidInvoices: metrics.paidInvoices ?? 0,
      revenueCents: metrics.revenueCents ?? 0,
      revenueLast30DaysCents: metrics.revenueLast30DaysCents ?? 0,
      sessions: metrics.sessions ?? 0,
      savedTexts: metrics.savedTexts ?? 0,
      certificates: metrics.certificates ?? 0,
      shadowingSessions: metrics.shadowingSessions ?? 0,
      shadowingAttempts: metrics.shadowingAttempts ?? 0,
      aiGenerations: metrics.aiGenerations ?? 0,
      onboardingCompleted: metrics.onboardingCompleted ?? 0,
      incompleteProfiles: metrics.incompleteProfiles ?? 0,
    },
    recentUsers: Array.isArray(payload.recentUsers) ? payload.recentUsers : [],
    recentInvoices: Array.isArray(payload.recentInvoices) ? payload.recentInvoices : [],
    recentSessions: Array.isArray(payload.recentSessions) ? payload.recentSessions : [],
    recentShadowingSessions: Array.isArray(payload.recentShadowingSessions) ? payload.recentShadowingSessions : [],
    recentUsageEvents: Array.isArray(payload.recentUsageEvents) ? payload.recentUsageEvents : [],
    incompleteProfiles: Array.isArray(payload.incompleteProfiles) ? payload.incompleteProfiles : [],
    adminUsers: Array.isArray(payload.adminUsers) ? payload.adminUsers : [],
    userSearch: payload.userSearch ?? '',
    billingSummary: normalizeBillingSummary(payload.billingSummary, payload.recentInvoices, payload.recentUsers),
    aiUsageSummary: normalizeAiUsageSummary(payload.aiUsageSummary),
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
  };
}

function summarizeBillingRows(rows: BillingChartRow[]): BillingPeriodSummary {
  return {
    paidInvoices: rows.reduce((sum, row) => sum + row.paidInvoices, 0),
    revenueCents: rows.reduce((sum, row) => sum + row.revenueCents, 0),
  };
}

function groupBillingRows(rows: BillingChartRow[], size: number): BillingChartRow[] {
  const grouped: BillingChartRow[] = [];
  for (let index = 0; index < rows.length; index += size) {
    const bucket = rows.slice(index, index + size);
    if (bucket.length === 0) continue;
    grouped.push({
      date: bucket[0].date,
      label: bucket.length === 1 ? bucket[0].label : `${bucket[0].label} - ${bucket[bucket.length - 1].label}`,
      paidInvoices: bucket.reduce((sum, row) => sum + row.paidInvoices, 0),
      revenueCents: bucket.reduce((sum, row) => sum + row.revenueCents, 0),
    });
  }
  return grouped;
}

function normalizeAiUsageSummary(summary: Partial<AiUsageSummary> | null | undefined): AiUsageSummary {
  return {
    provider: summary?.provider ?? EMPTY_AI_USAGE_SUMMARY.provider,
    model: summary?.model ?? EMPTY_AI_USAGE_SUMMARY.model,
    currency: summary?.currency ?? EMPTY_AI_USAGE_SUMMARY.currency,
    estimatedCostPerGenerationCents:
      typeof summary?.estimatedCostPerGenerationCents === 'number'
        ? summary.estimatedCostPerGenerationCents
        : EMPTY_AI_USAGE_SUMMARY.estimatedCostPerGenerationCents,
    today: summary?.today ?? EMPTY_AI_USAGE_PERIOD,
    last7Days: summary?.last7Days ?? EMPTY_AI_USAGE_PERIOD,
    last30Days: summary?.last30Days ?? EMPTY_AI_USAGE_PERIOD,
    allTime: summary?.allTime ?? EMPTY_AI_USAGE_PERIOD,
  };
}

export default function AdminDashboard() {
  const { language, t, translateLanguageName } = useI18n();
  const { session, user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriodKey>('last30Days');
  const [billingChart, setBillingChart] = useState<BillingChartKey>('daily');
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabaseReady = hasSupabaseEnv();

  async function loadOverview({ quiet = false, search = userSearch } = {}) {
    if (!session?.access_token) {
      setLoading(false);
      setError(t('admin.signInRequired'));
      return;
    }

    if (!supabaseReady) {
      setLoading(false);
      setError(t('admin.supabaseMissing'));
      return;
    }

    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('userSearch', search.trim());
      }

      const response = await fetchApi(`/api/admin/overview${params.size > 0 ? `?${params.toString()}` : ''}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.error ?? t('admin.unableLoad'));
      }

      setOverview(normalizeAdminOverview(payload));
    } catch (loadError) {
      setError(loadError instanceof DOMException && loadError.name === 'AbortError' ? t('admin.timeout') : loadError instanceof Error ? loadError.message : t('admin.unableLoad'));
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, [session?.access_token, supabaseReady]);

  useEffect(() => {
    if (!session?.access_token || !supabaseReady) {
      return;
    }

    const searchTimeout = window.setTimeout(() => {
      void loadOverview({ quiet: true, search: userSearch });
    }, 350);

    return () => {
      window.clearTimeout(searchTimeout);
    };
  }, [userSearch]);

  const conversionRate = useMemo(() => {
    if (!overview || overview.metrics.users === 0) {
      return 0;
    }

    return Math.round((overview.metrics.activeSubscriptions / overview.metrics.users) * 100);
  }, [overview]);

  const paidInvoiceRate = useMemo(() => {
    if (!overview || overview.recentInvoices.length === 0) {
      return 0;
    }

    const paid = overview.recentInvoices.filter((invoice) => isPaidBillingInvoice(invoice)).length;
    return Math.round((paid / overview.recentInvoices.length) * 100);
  }, [overview]);

  const billingSummary = normalizeBillingSummary(overview?.billingSummary, overview?.recentInvoices, overview?.recentUsers);
  const selectedBillingPeriod = billingSummary.periods[billingPeriod] ?? EMPTY_BILLING_PERIOD;
  const selectedBillingRows = billingSummary.charts[billingChart] ?? billingSummary.last30Days;
  const selectedBillingLabel = t(BILLING_PERIOD_OPTIONS.find((option) => option.key === billingPeriod)?.labelKey ?? 'period.last30Days');
  const aiUsageSummary = overview?.aiUsageSummary ?? EMPTY_AI_USAGE_SUMMARY;
  const onboardingRate = overview?.metrics.users
    ? Math.round((overview.metrics.onboardingCompleted / overview.metrics.users) * 100)
    : 0;
  const averageDictationScore = getAverageScore(overview?.recentSessions.map((sessionRow) => sessionRow.accuracy));
  const averageShadowingScore = getAverageScore(overview?.recentShadowingSessions.map((sessionRow) => sessionRow.average_score));
  const blockedUsers = overview?.recentUsers.filter((row) => row.is_blocked).length ?? 0;
  const activeAdmins = overview?.adminUsers.filter((row) => row.status === 'active').length ?? 0;
  const warningCount = overview?.warnings?.length ?? 0;

  async function runAdminAction(actionKey: string, request: () => Promise<Response>, successMessage: string) {
    setActingOn(actionKey);
    setActionStatus(null);
    setError(null);

    try {
      const response = await request();
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.error ?? t('admin.actionFailed'));
      }

      setActionStatus(successMessage);
      await loadOverview({ quiet: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('admin.actionFailed'));
    } finally {
      setActingOn(null);
    }
  }

  async function addAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newAdminEmail.trim()) {
      setError(t('admin.enterAdminEmail'));
      return;
    }

    await runAdminAction(
      'add-admin',
      () =>
        fetchApi('/api/admin/admin-users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newAdminEmail.trim() }),
        }),
      t('admin.accessGranted'),
    );
    setNewAdminEmail('');
  }

  function revokeAdmin(userId: string) {
    void runAdminAction(
      `revoke-admin-${userId}`,
      () =>
        fetchApi(`/api/admin/admin-users/${userId}/revoke`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      t('admin.accessRevoked'),
    );
  }

  function toggleBlockUser(row: AdminUserRow) {
    const shouldBlock = !row.is_blocked;
    void runAdminAction(
      `block-user-${row.id}`,
      () =>
        fetchApi(`/api/admin/users/${row.id}/block`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blocked: shouldBlock,
            reason: shouldBlock ? 'Blocked from admin dashboard' : '',
          }),
        }),
      shouldBlock ? t('admin.blocked') : t('admin.unblocked'),
    );
  }

  function cancelSubscription(userId: string) {
    void runAdminAction(
      `cancel-subscription-${userId}`,
      () =>
        fetchApi(`/api/admin/users/${userId}/cancel-subscription`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      t('admin.subscriptionCanceled'),
    );
  }

  function resetUserPassword(userId: string) {
    void runAdminAction(
      `reset-password-${userId}`,
      () =>
        fetchApi(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      t('admin.resetSent'),
    );
  }

  function deleteUser(row: AdminUserRow) {
    if (row.id === user?.id) {
      setError(t('admin.cannotDeleteSelf'));
      return;
    }

    const label = row.email || row.full_name || shortId(row.id);
    const confirmed = window.confirm(t('admin.deleteConfirm', { label }));
    if (!confirmed) return;

    void runAdminAction(
      `delete-user-${row.id}`,
      () =>
        fetchApi(`/api/admin/users/${row.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      t('admin.deleted'),
    );
  }

  return (
    <main className="wp-shell min-h-screen pt-24 pb-16 sm:pb-20">
      <header className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" />
            {t('admin.eyebrow')}
          </div>
          <h1 className="mt-5 font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">
            {t('admin.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            {t('admin.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {overview && (
            <p className="text-sm text-on-surface-variant">
              {t('admin.updated', { date: formatDateTime(overview.generatedAt, language) })}
            </p>
          )}
          <button
            type="button"
            onClick={() => void loadOverview({ quiet: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
        </div>
      </header>

      {error && (
        <section className="mb-8 rounded-2xl border border-error/20 bg-error/10 px-5 py-4 text-sm text-on-surface flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-bold">{t('admin.errorTitle')}</p>
            <p className="mt-1 text-on-surface-variant">{error}</p>
          </div>
        </section>
      )}

      {actionStatus && (
        <section className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm font-semibold text-on-surface">
          {actionStatus}
        </section>
      )}

      {loading ? (
        <div className="min-h-[420px] rounded-[2rem] bg-surface-container-lowest whisper-shadow flex items-center justify-center gap-3 text-on-surface-variant">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="font-semibold">{t('admin.loading')}</span>
        </div>
      ) : overview ? (
        <>
          <section className="mb-8 grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 rounded-[2rem] bg-surface-container-lowest p-5 sm:p-6 whisper-shadow">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{t('admin.health')}</p>
                  <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">
                    {warningCount === 0 ? t('admin.healthClean') : t('admin.healthWarnings', { count: warningCount })}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                    {t('admin.healthBody')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[26rem]">
                  <MiniDetail label={t('admin.api')} value={t('admin.online')} />
                  <MiniDetail label={t('admin.database')} value={t('admin.connected')} />
                  <MiniDetail label={t('admin.admins')} value={formatNumber(activeAdmins)} />
                  <MiniDetail label={t('admin.blockedUsers')} value={formatNumber(blockedUsers)} />
                </div>
              </div>
              {warningCount > 0 && (
                <div className="mt-5 grid gap-2">
                  {overview.warnings?.slice(0, 3).map((warning) => (
                    <div key={warning} className="flex items-start gap-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-on-surface">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="xl:col-span-4 rounded-[2rem] bg-primary p-5 sm:p-6 text-on-primary whisper-shadow">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container">{t('admin.operator')}</p>
                  <h2 className="mt-2 truncate font-headline text-xl font-black">{overview.admin.email || user?.email}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Crown className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{t('admin.role')}</p>
                  <p className="mt-2 font-headline text-lg font-black">{overview.admin.role ?? 'admin'}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{t('admin.updated', { date: '' }).trim()}</p>
                  <p className="mt-2 font-headline text-lg font-black">{formatTime(overview.generatedAt, language)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
            <AdminMetricCard
              label={t('admin.registeredUsers')}
              value={formatNumber(overview.metrics.users)}
              note={t('admin.completedSetup', { value: onboardingRate })}
              icon={<Users className="h-5 w-5" />}
              strong
            />
            <AdminMetricCard
              label={t('admin.activeSubscribers')}
              value={formatNumber(overview.metrics.activeSubscriptions)}
              note={t('admin.subscriptionRecords', { count: formatNumber(overview.metrics.subscriptions) })}
              icon={<BadgeCheck className="h-5 w-5" />}
            />
            <AdminMetricCard
              label={t('admin.paidRevenue')}
              value={formatMoney(overview.metrics.revenueCents)}
              note={t('admin.last30Days', { amount: formatMoney(overview.metrics.revenueLast30DaysCents) })}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <AdminMetricCard
              label={t('admin.paidInvoices')}
              value={formatNumber(overview.metrics.paidInvoices)}
              note={t('admin.recentPaidRate', { value: paidInvoiceRate })}
              icon={<ReceiptText className="h-5 w-5" />}
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 sm:gap-5 mb-10">
            <CompactMetric label={t('admin.dictationSessions')} value={overview.metrics.sessions} icon={<Activity className="h-4 w-4" />} />
            <CompactMetric label={t('admin.shadowingSessions')} value={overview.metrics.shadowingSessions} icon={<Mic2 className="h-4 w-4" />} />
            <CompactMetric label={t('admin.shadowingAttempts')} value={overview.metrics.shadowingAttempts} icon={<ListChecks className="h-4 w-4" />} />
            <CompactMetric label={t('admin.aiGenerations')} value={overview.metrics.aiGenerations} icon={<Sparkles className="h-4 w-4" />} />
            <CompactMetric label={t('admin.savedTexts')} value={overview.metrics.savedTexts} icon={<BookOpen className="h-4 w-4" />} />
            <CompactMetric label={t('admin.certificatesIssued')} value={overview.metrics.certificates} icon={<FileText className="h-4 w-4" />} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
            <div className="xl:col-span-7 space-y-8">
              <AdminPanel
                title={userSearch.trim() ? t('admin.userSearchResults') : t('admin.registeredUsers')}
                actionLabel={userSearch.trim() ? t('admin.matches', { count: overview.recentUsers.length }) : t('admin.latest25')}
              >
                <div className="p-2 pb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder={t('admin.searchPlaceholder')}
                      className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:bg-surface-container-lowest"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left">
                    <thead>
                      <tr className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                        <th className="px-5 py-4">{t('admin.user')}</th>
                        <th className="px-5 py-4">{t('admin.plan')}</th>
                        <th className="px-5 py-4">{t('admin.joined')}</th>
                        <th className="px-5 py-4">{t('admin.status')}</th>
                        <th className="px-5 py-4 text-right">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {overview.recentUsers.map((row) => (
                        <tr key={row.id} className="hover:bg-surface-container-low/50">
                          <td className="px-5 py-4">
                            <Link to={`/admin/users/${row.id}`} className="font-bold text-on-surface transition hover:text-primary hover:underline">
                              {row.full_name || row.email || t('admin.unnamedUser')}
                            </Link>
                            <p className="mt-1 text-xs text-on-surface-variant">{row.email ?? row.id}</p>
                          </td>
                          <td className="px-5 py-4">
                            <PlanCell plan={row.plan} />
                          </td>
                          <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDate(row.created_at, language)}</td>
                          <td className="px-5 py-4">
                            <StatusPill label={row.is_blocked ? t('common.blocked') : t('common.active')} paid={!row.is_blocked} />
                            {row.blocked_reason && <p className="mt-2 text-xs text-on-surface-variant">{row.blocked_reason}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconActionButton
                                label={row.is_blocked ? t('admin.unblockUser') : t('admin.blockUser')}
                                loading={actingOn === `block-user-${row.id}`}
                                onClick={() => toggleBlockUser(row)}
                              >
                                {row.is_blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </IconActionButton>
                              <IconActionButton
                                label={t('admin.passwordReset')}
                                loading={actingOn === `reset-password-${row.id}`}
                                onClick={() => resetUserPassword(row.id)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </IconActionButton>
                              <IconActionButton
                                label={t('admin.cancelSubscription')}
                                loading={actingOn === `cancel-subscription-${row.id}`}
                                onClick={() => cancelSubscription(row.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </IconActionButton>
                              <IconActionButton
                                label={t('admin.deleteUser')}
                                loading={actingOn === `delete-user-${row.id}`}
                                onClick={() => deleteUser(row)}
                                danger
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overview.recentUsers.length === 0 && (
                    <div className="px-5 py-8 text-sm text-on-surface-variant">
                      {t('admin.noMatches')}
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.learnerSetup')} actionLabel={t('admin.ready', { value: onboardingRate })}>
                <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                  <div className="rounded-2xl bg-surface-container-low p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('admin.onboardingCompleted')}</p>
                        <p className="mt-3 font-headline text-4xl font-black text-on-surface">{onboardingRate}%</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-primary">
                        <UserCheck className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(onboardingRate, 100)}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-on-surface-variant">
                      {t('admin.usersCompletedSetup', { done: formatNumber(overview.metrics.onboardingCompleted), total: formatNumber(overview.metrics.users) })}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {overview.incompleteProfiles.slice(0, 5).map((profileRow) => (
                      <div key={profileRow.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{profileRow.full_name || profileRow.email || t('admin.unnamedUser')}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{profileRow.email ?? shortId(profileRow.id)}</p>
                        </div>
                        <StatusPill label={`${translateLanguageName(profileRow.target_language)} / ${profileRow.cefr_level ?? t('admin.noLevel')}`} />
                      </div>
                    ))}
                    {overview.incompleteProfiles.length === 0 && (
                      <div className="rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                        {t('admin.allLearnersReady')}
                      </div>
                    )}
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.recentInvoices')} actionLabel={t('admin.billingLedger')}>
                <div className="space-y-3">
                  {overview.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="rounded-2xl bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-on-surface">{invoice.label ?? `Invoice ${invoice.id.slice(0, 8)}`}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {formatDate(invoice.issued_at, language)} - {t('admin.user')} {shortId(invoice.user_id)}
                        </p>
                        {(invoice.hosted_invoice_url || invoice.invoice_pdf_url) && (
                          <div className="mt-2 flex gap-3 text-xs font-bold text-primary">
                            {invoice.hosted_invoice_url && (
                              <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="hover:underline">
                                {t('admin.view')}
                              </a>
                            )}
                            {invoice.invoice_pdf_url && (
                              <a href={invoice.invoice_pdf_url} target="_blank" rel="noreferrer" className="hover:underline">
                                {t('admin.pdf')}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <p className="font-headline font-black text-lg text-on-surface">
                          {formatMoney(invoice.amount_cents ?? 0, invoice.currency ?? 'usd')}
                        </p>
                        <StatusPill label={invoice.status ?? invoice.payment_status ?? t('admin.unknown')} paid={isPaidBillingInvoice(invoice)} />
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <div className="xl:col-span-5 space-y-8">
              <AdminPanel title={t('admin.learningOps')} actionLabel={t('admin.liveQuality')}>
                <div className="grid grid-cols-2 gap-3">
                  <QualityCard label={t('admin.dictationAvg')} value={averageDictationScore === null ? '--' : `${averageDictationScore}%`} icon={<Gauge className="h-5 w-5" />} />
                  <QualityCard label={t('admin.shadowingAvg')} value={averageShadowingScore === null ? '--' : `${averageShadowingScore}%`} icon={<Mic2 className="h-5 w-5" />} />
                  <QualityCard label={t('admin.conversion')} value={`${conversionRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
                  <QualityCard label={t('admin.languagesSet')} value={`${onboardingRate}%`} icon={<Languages className="h-5 w-5" />} />
                </div>
                <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
                  <p className="font-bold text-on-surface">{t('admin.operationalFocus')}</p>
                  <div className="mt-3 grid gap-2 text-sm text-on-surface-variant">
                    <AdminChecklistItem done={warningCount === 0} label={t('admin.checkNoWarnings')} />
                    <AdminChecklistItem done={overview.metrics.incompleteProfiles === 0} label={t('admin.checkLearnerSetup')} />
                    <AdminChecklistItem done={overview.metrics.activeSubscriptions > 0} label={t('admin.checkBilling')} />
                    <AdminChecklistItem done={averageDictationScore === null || averageDictationScore >= 70} label={t('admin.checkDictationQuality')} />
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.shadowingSessions')} actionLabel={t('admin.latest10')}>
                <div className="space-y-3">
                  {overview.recentShadowingSessions.map((sessionRow) => (
                    <div key={sessionRow.id} className="rounded-2xl bg-surface-container-low p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{sessionRow.title ?? t('admin.shadowingLesson')}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {translateLanguageName(sessionRow.language) ?? t('admin.unknown')} / {sessionRow.cefr_level ?? t('admin.noLevel')} - {formatDate(sessionRow.updated_at, language)}
                          </p>
                        </div>
                        <StatusPill label={sessionRow.status ?? t('admin.unknown')} paid={sessionRow.status === 'completed'} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniDetail label={t('admin.average')} value={sessionRow.average_score === null ? '--' : `${Math.round(sessionRow.average_score)}%`} />
                        <MiniDetail label={t('admin.best')} value={sessionRow.best_score === null ? '--' : `${Math.round(sessionRow.best_score)}%`} />
                        <MiniDetail label={t('admin.progress')} value={`${sessionRow.completed_segments ?? 0}/${sessionRow.total_segments ?? 0}`} />
                      </div>
                    </div>
                  ))}
                  {overview.recentShadowingSessions.length === 0 && (
                    <div className="rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                      {t('admin.noShadowing')}
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.aiUsage')} actionLabel={t('admin.costControl')}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <UsageCostCard
                    title={t('period.last30Days')}
                    summary={aiUsageSummary.last30Days}
                    currency={aiUsageSummary.currency}
                    strong
                  />
                  <UsageCostCard
                    title={t('admin.allTracked')}
                    summary={aiUsageSummary.allTime}
                    currency={aiUsageSummary.currency}
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MiniDetail label={t('admin.provider')} value={aiUsageSummary.provider} />
                  <MiniDetail label={t('admin.model')} value={aiUsageSummary.model} />
                  <MiniDetail
                    label={t('admin.perRequest')}
                    value={formatMoneyFromCents(aiUsageSummary.estimatedCostPerGenerationCents, aiUsageSummary.currency)}
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>
                      {t('admin.aiCostNote')}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {overview.recentUsageEvents.map((eventRow) => (
                    <div key={eventRow.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">{eventRow.feature_key.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {eventRow.event_type} - {t('admin.user')} {shortId(eventRow.user_id)} - {formatDateTime(eventRow.created_at, language)}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container font-headline font-black text-primary">
                        {eventRow.quantity}
                      </span>
                    </div>
                  ))}
                  {overview.recentUsageEvents.length === 0 && (
                    <div className="rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                      {t('admin.noAiUsage')}
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.adminAccess')} actionLabel={t('admin.databaseRoles')}>
                <form onSubmit={addAdmin} className="rounded-2xl bg-surface-container-low p-4 flex flex-col sm:flex-row gap-3">
                  <input
                    value={newAdminEmail}
                    onChange={(event) => setNewAdminEmail(event.target.value)}
                    type="email"
                    placeholder="registered@email.com"
                    className="min-w-0 flex-1 rounded-xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={actingOn === 'add-admin'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary disabled:opacity-70"
                  >
                    {actingOn === 'add-admin' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {t('admin.add')}
                  </button>
                </form>

                <div className="mt-3 space-y-3">
                  {overview.adminUsers.map((adminUser) => (
                    <div key={adminUser.user_id} className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">{adminUser.email}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {adminUser.role} - {formatDate(adminUser.created_at, language)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label={adminUser.status} paid={adminUser.status === 'active'} />
                        {adminUser.status === 'active' && (
                          <IconActionButton
                            label={t('admin.revokeAdmin')}
                            loading={actingOn === `revoke-admin-${adminUser.user_id}`}
                            onClick={() => revokeAdmin(adminUser.user_id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </IconActionButton>
                        )}
                      </div>
                    </div>
                  ))}
                  {overview.adminUsers.length === 0 && (
                    <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                      {t('admin.noAdmins')}
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title={t('admin.payments')} actionLabel={t('admin.revenueAnalytics')}>
                <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    {BILLING_PERIOD_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setBillingPeriod(option.key)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          billingPeriod === option.key
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t(option.labelKey)}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {BILLING_CHART_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setBillingChart(option.key)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          billingChart === option.key
                            ? 'bg-primary-container text-primary'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t(option.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <PaymentSummaryCard title={selectedBillingLabel} summary={selectedBillingPeriod} />
                  <PaymentSummaryCard title={t('admin.allRevenue')} summary={billingSummary.periods.allTime} />
                </div>
                <RevenueChart rows={selectedBillingRows} title={t('admin.revenueChart', { label: t(BILLING_CHART_OPTIONS.find((option) => option.key === billingChart)?.labelKey ?? 'chart.daily') })} />
                <RecentPayers
                  title={t('admin.paidToday')}
                  payers={billingSummary.recentPayers.today}
                  emptyLabel={t('admin.noPaymentsToday')}
                />
                <RecentPayers
                  title={t('admin.paidYesterday')}
                  payers={billingSummary.recentPayers.yesterday}
                  emptyLabel={t('admin.noPaymentsYesterday')}
                />
              </AdminPanel>

              <AdminPanel title={t('admin.learningActivity')} actionLabel={t('admin.latest10')}>
                <div className="space-y-3">
                  {overview.recentSessions.map((sessionRow) => (
                    <div key={sessionRow.id} className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-on-surface">{sessionRow.title ?? t('admin.untitledSession')}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {translateLanguageName(sessionRow.language) ?? t('admin.unknownLanguage')} - {formatDate(sessionRow.created_at, language)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-black text-xl text-primary">{Math.round(sessionRow.accuracy ?? 0)}%</p>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('admin.score')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <section className="rounded-[2rem] bg-primary p-6 sm:p-8 text-on-primary whisper-shadow">
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container">{t('admin.signedInAdmin')}</p>
                <h2 className="mt-3 font-headline font-black text-2xl">{overview.admin.email || user?.email}</h2>
                <p className="mt-3 text-sm leading-6 text-on-primary/80">
                  {t('admin.accessChecked')}
                </p>
                <Link
                  to="/dashboard"
                  className="mt-6 inline-flex rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-white/25"
                >
                  {t('admin.backToDashboard')}
                </Link>
              </section>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function AdminMetricCard({
  label,
  value,
  note,
  icon,
  strong,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 whisper-shadow ${strong ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface'}`}>
      <div className="flex items-center justify-between gap-4">
        <p className={`text-[0.6875rem] uppercase tracking-widest font-bold ${strong ? 'text-primary-container' : 'text-on-surface-variant'}`}>
          {label}
        </p>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${strong ? 'bg-white/15' : 'bg-primary-container text-primary'}`}>
          {icon}
        </div>
      </div>
      <p className="mt-6 font-headline font-black text-3xl sm:text-4xl">{value}</p>
      <p className={`mt-3 text-sm ${strong ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>{note}</p>
    </div>
  );
}

function CompactMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-5 flex items-center justify-between gap-4 whisper-shadow">
      <div>
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant">{label}</p>
        <p className="mt-2 font-headline font-black text-2xl text-on-surface">{formatNumber(value)}</p>
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">{icon}</div>
    </div>
  );
}

function QualityCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-primary">{icon}</div>
      </div>
      <p className="mt-4 font-headline text-2xl font-black text-on-surface">{value}</p>
    </div>
  );
}

function AdminChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-primary text-on-primary' : 'bg-error/10 text-error'}`}>
        {done ? <BadgeCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      </span>
      <span>{label}</span>
    </div>
  );
}

function AdminPanel({ title, actionLabel, children }: { title: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-surface-container-lowest whisper-shadow overflow-hidden">
      <div className="px-5 sm:px-6 py-5 border-b border-surface-container flex items-center justify-between gap-4">
        <h2 className="font-headline font-bold text-xl text-on-surface">{title}</h2>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {actionLabel}
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">{label}</p>
      <p className="mt-1 text-xs font-bold text-on-surface">{value}</p>
    </div>
  );
}

function PaymentSummaryCard({ title, summary = EMPTY_BILLING_PERIOD }: { title: string; summary?: BillingPeriodSummary }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <p className="mt-3 font-headline font-black text-2xl text-on-surface">{formatNumber(summary.paidInvoices)}</p>
      <p className="mt-1 text-sm font-bold text-primary">{formatMoney(summary.revenueCents)}</p>
    </div>
  );
}

function PlanCell({ plan }: { plan?: AdminUserPlan }) {
  const { t } = useI18n();
  const safePlan = plan ?? {
    name: 'Free',
    status: 'free',
    billingCycle: null,
    amountCents: 0,
    currency: 'usd',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
  const isPaid = ['active', 'trialing', 'paid', 'complete', 'completed', 'succeeded'].includes(safePlan.status);

  return (
    <div className="min-w-[9rem]">
      <StatusPill label={safePlan.name || 'Free'} paid={isPaid} />
      <p className="mt-2 text-xs text-on-surface-variant">
        {safePlan.amountCents > 0 ? `${formatMoney(safePlan.amountCents, safePlan.currency)} ${safePlan.billingCycle ?? ''}`.trim() : t('common.noPaidPlan')}
      </p>
      {safePlan.status !== 'free' && (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {safePlan.cancelAtPeriodEnd ? t('common.canceling') : safePlan.status}
        </p>
      )}
    </div>
  );
}

function UsageCostCard({
  title,
  summary = EMPTY_AI_USAGE_PERIOD,
  currency,
  strong,
}: {
  title: string;
  summary?: AiUsagePeriodSummary;
  currency: string;
  strong?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={`rounded-2xl p-4 ${strong ? 'bg-primary text-on-primary' : 'bg-surface-container-low'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${strong ? 'text-primary-container' : 'text-on-surface-variant'}`}>
        {title}
      </p>
      <p className="mt-3 font-headline font-black text-2xl">{formatMoneyFromCents(summary.estimatedCostCents, currency)}</p>
      <p className={`mt-1 text-sm font-bold ${strong ? 'text-on-primary/80' : 'text-primary'}`}>
        {t('user.generations', { count: formatNumber(summary.generations) })}
      </p>
    </div>
  );
}

function RevenueChart({ rows = [], title = 'Last 30 days' }: { rows?: BillingChartRow[]; title?: string }) {
  const { t } = useI18n();
  const maxRevenue = Math.max(...rows.map((row) => row.revenueCents), 1);

  return (
    <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-on-surface">{title}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{t('admin.paidInvoices')} / {t('admin.revenueAnalytics')}</p>
        </div>
        <span className="text-xs font-bold text-primary">
          {formatMoney(rows.reduce((sum, row) => sum + row.revenueCents, 0))}
        </span>
      </div>
      <div className="mt-5 flex h-36 items-end gap-1.5">
        {rows.map((row) => {
          const height = Math.max((row.revenueCents / maxRevenue) * 100, row.revenueCents > 0 ? 8 : 2);
          return (
            <div key={row.date} className="group relative flex min-w-0 flex-1 items-end justify-center">
              <div
                className="w-full rounded-t bg-primary/25 transition group-hover:bg-primary"
                style={{ height: `${height}%` }}
                title={`${row.label}: ${row.paidInvoices} ${t('admin.paidInvoices')} - ${formatMoney(row.revenueCents)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        <span>{rows[0]?.label ?? ''}</span>
        <span>{rows[rows.length - 1]?.label ?? ''}</span>
      </div>
    </div>
  );
}

function RecentPayers({ title, payers = [], emptyLabel }: { title: string; payers?: BillingPayer[]; emptyLabel: string }) {
  const { t } = useI18n();

  return (
    <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
      <p className="font-bold text-on-surface">{title}</p>
      <div className="mt-3 space-y-3">
        {payers.map((payer, index) => (
          <div key={`${payer.userId ?? 'unknown'}-${payer.paidAt ?? 'no-date'}-${payer.label ?? index}`} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-on-surface">{payer.name || t('admin.unnamedUser')}</p>
              <p className="mt-1 truncate text-xs text-on-surface-variant">{payer.email ?? shortId(payer.userId)}</p>
            </div>
            <span className="shrink-0 text-sm font-black text-primary">{formatMoney(payer.amountCents, payer.currency)}</span>
          </div>
        ))}
        {payers.length === 0 && <p className="text-sm text-on-surface-variant">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function StatusPill({ label, paid }: { label: string; paid?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
        paid ? 'bg-primary-container text-primary' : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {label}
    </span>
  );
}

function IconActionButton({
  label,
  loading,
  onClick,
  children,
  danger,
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant transition disabled:opacity-70 ${
        danger ? 'hover:bg-error hover:text-on-error' : 'hover:bg-primary hover:text-on-primary'
      }`}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function formatMoney(amountCents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatMoneyFromCents(amountCents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: amountCents > 0 && amountCents < 1 ? 4 : 2,
  }).format(amountCents / 100);
}

function formatDate(value?: string | null, language: 'en' | 'de' = 'en') {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '--';
  }

  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string, language: 'en' | 'de' = 'en') {
  return new Date(value).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(value: string, language: 'en' | 'de' = 'en') {
  return new Date(value).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getAverageScore(values?: Array<number | null | undefined>) {
  const safeValues = (values ?? []).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (safeValues.length === 0) {
    return null;
  }

  return Math.round(safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length);
}

function shortId(value?: string | null) {
  return value ? value.slice(0, 8) : 'Unknown user';
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.trim().slice(0, 80);
    throw new Error(
      preview.length === 0
        ? `Admin API returned an empty ${response.status} response. Restart the local server and try again.`
        : preview.startsWith('<!doctype') || preview.startsWith('<html')
          ? 'Admin API is returning the React app instead of JSON. In production, deploy server.ts as a backend and set VITE_API_BASE_URL to that backend URL. Locally, start the app with npm run dev.'
          : `Admin API returned a non-JSON response: ${preview}`,
    );
  }

  const text = await response.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Admin API returned invalid JSON.');
  }
}

