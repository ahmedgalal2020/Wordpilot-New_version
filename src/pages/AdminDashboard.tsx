import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  Ban,
  BookOpen,
  CreditCard,
  FileText,
  KeyRound,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasSupabaseEnv } from '../lib/env';
import { isPaidBillingInvoice } from '../lib/entitlements';

type AdminOverview = {
  generatedAt: string;
  admin: {
    email: string;
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
  };
  recentUsers: AdminUserRow[];
  recentInvoices: AdminInvoiceRow[];
  recentSessions: AdminSessionRow[];
  adminUsers: AdminUserAccessRow[];
  userSearch: string;
  billingSummary: BillingSummary;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  target_language: string | null;
  cefr_level: string | null;
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

type BillingSummary = {
  today: BillingPeriodSummary;
  yesterday: BillingPeriodSummary;
  last30Days: BillingChartRow[];
  recentPayers: {
    today: BillingPayer[];
    yesterday: BillingPayer[];
  };
};

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
  userId: string;
  name: string;
  email: string | null;
  amountCents: number;
  currency: string;
  paidAt: string | null;
  label: string | null;
};

const EMPTY_BILLING_PERIOD: BillingPeriodSummary = {
  paidInvoices: 0,
  revenueCents: 0,
};

const EMPTY_BILLING_SUMMARY: BillingSummary = {
  today: EMPTY_BILLING_PERIOD,
  yesterday: EMPTY_BILLING_PERIOD,
  last30Days: [],
  recentPayers: {
    today: [],
    yesterday: [],
  },
};

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
        userId: invoice.user_id,
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

export default function AdminDashboard() {
  const { session, user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabaseReady = hasSupabaseEnv();

  async function loadOverview({ quiet = false, search = userSearch } = {}) {
    if (!session?.access_token) {
      setLoading(false);
      setError('Sign in with an admin account to open this dashboard.');
      return;
    }

    if (!supabaseReady) {
      setLoading(false);
      setError('Supabase is not configured yet.');
      return;
    }

    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('userSearch', search.trim());
      }

      const response = await fetch(`/api/admin/overview${params.size > 0 ? `?${params.toString()}` : ''}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load admin dashboard.');
      }

      setOverview(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard.');
    } finally {
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

  async function runAdminAction(actionKey: string, request: () => Promise<Response>, successMessage: string) {
    setActingOn(actionKey);
    setActionStatus(null);
    setError(null);

    try {
      const response = await request();
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.error ?? 'Admin action failed.');
      }

      setActionStatus(successMessage);
      await loadOverview({ quiet: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Admin action failed.');
    } finally {
      setActingOn(null);
    }
  }

  async function addAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newAdminEmail.trim()) {
      setError('Enter the email of a registered user first.');
      return;
    }

    await runAdminAction(
      'add-admin',
      () =>
        fetch('/api/admin/admin-users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newAdminEmail.trim() }),
        }),
      'Admin access was granted.',
    );
    setNewAdminEmail('');
  }

  function revokeAdmin(userId: string) {
    void runAdminAction(
      `revoke-admin-${userId}`,
      () =>
        fetch(`/api/admin/admin-users/${userId}/revoke`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      'Admin access was revoked.',
    );
  }

  function toggleBlockUser(row: AdminUserRow) {
    const shouldBlock = !row.is_blocked;
    void runAdminAction(
      `block-user-${row.id}`,
      () =>
        fetch(`/api/admin/users/${row.id}/block`, {
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
      shouldBlock ? 'User account was blocked.' : 'User account was unblocked.',
    );
  }

  function cancelSubscription(userId: string) {
    void runAdminAction(
      `cancel-subscription-${userId}`,
      () =>
        fetch(`/api/admin/users/${userId}/cancel-subscription`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      'Active subscription was canceled.',
    );
  }

  function resetUserPassword(userId: string) {
    void runAdminAction(
      `reset-password-${userId}`,
      () =>
        fetch(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      'Password reset email was sent to the user.',
    );
  }

  return (
    <main className="pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto min-h-screen">
      <header className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" />
            Admin Operations
          </div>
          <h1 className="mt-5 font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface">
            Control Center
          </h1>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            Monitor users, subscriptions, invoices, revenue, and learning activity from one focused workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {overview && (
            <p className="text-sm text-on-surface-variant">
              Updated {formatDateTime(overview.generatedAt)}
            </p>
          )}
          <button
            type="button"
            onClick={() => void loadOverview({ quiet: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <section className="mb-8 rounded-2xl border border-error/20 bg-error/10 px-5 py-4 text-sm text-on-surface flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-bold">Admin data is not available</p>
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
          <span className="font-semibold">Loading admin dashboard...</span>
        </div>
      ) : overview ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
            <AdminMetricCard
              label="Registered Users"
              value={formatNumber(overview.metrics.users)}
              note={`${conversionRate}% active paid conversion`}
              icon={<Users className="h-5 w-5" />}
              strong
            />
            <AdminMetricCard
              label="Active Subscribers"
              value={formatNumber(overview.metrics.activeSubscriptions)}
              note={`${formatNumber(overview.metrics.subscriptions)} total subscription records`}
              icon={<BadgeCheck className="h-5 w-5" />}
            />
            <AdminMetricCard
              label="Paid Revenue"
              value={formatMoney(overview.metrics.revenueCents)}
              note={`${formatMoney(overview.metrics.revenueLast30DaysCents)} in last 30 days`}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <AdminMetricCard
              label="Paid Invoices"
              value={formatNumber(overview.metrics.paidInvoices)}
              note={`${paidInvoiceRate}% of recent invoices paid`}
              icon={<ReceiptText className="h-5 w-5" />}
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
            <CompactMetric label="Dictation sessions" value={overview.metrics.sessions} icon={<Activity className="h-4 w-4" />} />
            <CompactMetric label="Saved texts" value={overview.metrics.savedTexts} icon={<BookOpen className="h-4 w-4" />} />
            <CompactMetric label="Certificates issued" value={overview.metrics.certificates} icon={<FileText className="h-4 w-4" />} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
            <div className="xl:col-span-7 space-y-8">
              <AdminPanel
                title={userSearch.trim() ? 'User Search Results' : 'Registered Users'}
                actionLabel={userSearch.trim() ? `${overview.recentUsers.length} matches` : 'Latest 25'}
              >
                <div className="p-2 pb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search registered users by name or email"
                      className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:bg-surface-container-lowest"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                        <th className="px-5 py-4">User</th>
                        <th className="px-5 py-4">Target</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {overview.recentUsers.map((row) => (
                        <tr key={row.id} className="hover:bg-surface-container-low/50">
                          <td className="px-5 py-4">
                            <p className="font-bold text-on-surface">{row.full_name || row.email || 'Unnamed user'}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">{row.email ?? row.id}</p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill label={`${row.target_language ?? 'No language'} / ${row.cefr_level ?? 'No level'}`} />
                          </td>
                          <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDate(row.created_at)}</td>
                          <td className="px-5 py-4">
                            <StatusPill label={row.is_blocked ? 'blocked' : 'active'} paid={!row.is_blocked} />
                            {row.blocked_reason && <p className="mt-2 text-xs text-on-surface-variant">{row.blocked_reason}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <IconActionButton
                                label={row.is_blocked ? 'Unblock user' : 'Block user'}
                                loading={actingOn === `block-user-${row.id}`}
                                onClick={() => toggleBlockUser(row)}
                              >
                                {row.is_blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </IconActionButton>
                              <IconActionButton
                                label="Send password reset"
                                loading={actingOn === `reset-password-${row.id}`}
                                onClick={() => resetUserPassword(row.id)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </IconActionButton>
                              <IconActionButton
                                label="Cancel subscription"
                                loading={actingOn === `cancel-subscription-${row.id}`}
                                onClick={() => cancelSubscription(row.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </IconActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overview.recentUsers.length === 0 && (
                    <div className="px-5 py-8 text-sm text-on-surface-variant">
                      No registered users match this search.
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title="Recent Invoices" actionLabel="Billing ledger">
                <div className="space-y-3">
                  {overview.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="rounded-2xl bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-on-surface">{invoice.label ?? `Invoice ${invoice.id.slice(0, 8)}`}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {formatDate(invoice.issued_at)} - user {shortId(invoice.user_id)}
                        </p>
                        {(invoice.hosted_invoice_url || invoice.invoice_pdf_url) && (
                          <div className="mt-2 flex gap-3 text-xs font-bold text-primary">
                            {invoice.hosted_invoice_url && (
                              <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="hover:underline">
                                View
                              </a>
                            )}
                            {invoice.invoice_pdf_url && (
                              <a href={invoice.invoice_pdf_url} target="_blank" rel="noreferrer" className="hover:underline">
                                PDF
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <p className="font-headline font-black text-lg text-on-surface">
                          {formatMoney(invoice.amount_cents ?? 0, invoice.currency ?? 'usd')}
                        </p>
                        <StatusPill label={invoice.status ?? invoice.payment_status ?? 'unknown'} paid={isPaidBillingInvoice(invoice)} />
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <div className="xl:col-span-5 space-y-8">
              <AdminPanel title="Admin Access" actionLabel="Database roles">
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
                    Add
                  </button>
                </form>

                <div className="mt-3 space-y-3">
                  {overview.adminUsers.map((adminUser) => (
                    <div key={adminUser.user_id} className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">{adminUser.email}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {adminUser.role} - {formatDate(adminUser.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label={adminUser.status} paid={adminUser.status === 'active'} />
                        {adminUser.status === 'active' && (
                          <IconActionButton
                            label="Revoke admin"
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
                      No database admins yet. The current access may still be coming from the environment bootstrap list.
                    </div>
                  )}
                </div>
              </AdminPanel>

              <AdminPanel title="Payments" actionLabel="Today / yesterday">
                <div className="grid grid-cols-2 gap-3">
                  <PaymentSummaryCard title="Today" summary={billingSummary.today} />
                  <PaymentSummaryCard title="Yesterday" summary={billingSummary.yesterday} />
                </div>
                <RevenueChart rows={billingSummary.last30Days} />
                <RecentPayers
                  title="Paid today"
                  payers={billingSummary.recentPayers.today}
                  emptyLabel="No payments today."
                />
                <RecentPayers
                  title="Paid yesterday"
                  payers={billingSummary.recentPayers.yesterday}
                  emptyLabel="No payments yesterday."
                />
              </AdminPanel>

              <AdminPanel title="Learning Activity" actionLabel="Latest 10">
                <div className="space-y-3">
                  {overview.recentSessions.map((sessionRow) => (
                    <div key={sessionRow.id} className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-on-surface">{sessionRow.title ?? 'Untitled session'}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {sessionRow.language ?? 'Unknown language'} - {formatDate(sessionRow.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-black text-xl text-primary">{Math.round(sessionRow.accuracy ?? 0)}%</p>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <section className="rounded-[2rem] bg-primary p-6 sm:p-8 text-on-primary whisper-shadow">
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container">Signed in admin</p>
                <h2 className="mt-3 font-headline font-black text-2xl">{overview.admin.email || user?.email}</h2>
                <p className="mt-3 text-sm leading-6 text-on-primary/80">
                  Access is checked on the server against the admin allowlist before any platform-wide data is returned.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-6 inline-flex rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-white/25"
                >
                  Back to user dashboard
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

function RevenueChart({ rows = [] }: { rows?: BillingChartRow[] }) {
  const maxRevenue = Math.max(...rows.map((row) => row.revenueCents), 1);

  return (
    <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-on-surface">Last 30 days</p>
          <p className="mt-1 text-xs text-on-surface-variant">Paid invoices per day</p>
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
                title={`${row.label}: ${row.paidInvoices} paid - ${formatMoney(row.revenueCents)}`}
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
  return (
    <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
      <p className="font-bold text-on-surface">{title}</p>
      <div className="mt-3 space-y-3">
        {payers.map((payer) => (
          <div key={`${payer.userId}-${payer.paidAt}-${payer.label}`} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-on-surface">{payer.name}</p>
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
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant transition hover:bg-primary hover:text-on-primary disabled:opacity-70"
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

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(value: string) {
  return value.slice(0, 8);
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
          ? 'Admin API is returning the React app instead of JSON. Restart the local server with npm run dev so server.ts routes are active.'
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
