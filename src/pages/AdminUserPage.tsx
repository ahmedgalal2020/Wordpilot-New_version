import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, BookOpen, CreditCard, ExternalLink, FileText, Gauge, LoaderCircle, Mic2, ReceiptText, RefreshCw, Sparkles, Target, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';
import { useI18n } from '../i18n';

type AdminUserDetail = {
  generatedAt: string;
  user: {
    auth: {
      id: string;
      email: string | null;
      createdAt: string | null;
      lastSignInAt: string | null;
      providers: string[];
      blocked: boolean;
    };
    profile: {
      id: string;
      email: string | null;
      full_name: string | null;
      native_language: string | null;
      target_language: string | null;
      cefr_level: string | null;
      goal_cefr_level: string | null;
      onboarding_completed: boolean;
      onboarding_completed_at: string | null;
      is_blocked: boolean;
      blocked_reason: string | null;
      created_at: string;
      updated_at: string;
    } | null;
    plan: AdminUserPlan;
  };
  metrics: {
    revenueCents: number;
    paidInvoices: number;
    subscriptions: number;
    aiGenerations: number;
    aiEstimatedCostCents: number;
    dictationSessions: number;
    dictationAverageScore: number | null;
    shadowingSessions: number;
    shadowingAverageScore: number | null;
    curriculumLessons: number;
    curriculumPassedLessons: number;
    exerciseAttempts: number;
    savedTexts: number;
    generatedTexts: number;
    certificates: number;
  };
  billing: {
    subscriptions: AdminSubscription[];
    invoices: AdminInvoice[];
  };
  aiUsage: {
    summary: AiUsageSummary;
    events: AdminUsageEvent[];
  };
  learning: {
    dictationSessions: AdminDictationSession[];
    shadowingSessions: AdminShadowingSession[];
    lessonProgress: AdminLessonProgress[];
    exerciseAttempts: AdminExerciseAttempt[];
    reviewQueue: AdminReviewItem[];
    savedTexts: AdminTextItem[];
    generatedTexts: AdminTextItem[];
    certificates: AdminCertificate[];
  };
  warnings: string[];
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

type AiUsageSummary = {
  provider: string;
  model: string;
  currency: string;
  estimatedCostPerGenerationCents: number;
  today: AiUsagePeriod;
  last7Days: AiUsagePeriod;
  last30Days: AiUsagePeriod;
  allTime: AiUsagePeriod;
};

type AiUsagePeriod = {
  generations: number;
  estimatedCostCents: number;
};

type AdminSubscription = {
  id: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  amount_cents: number;
  currency: string;
  payment_status: string | null;
  current_period_end: string | null;
  renewal_date: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

type AdminInvoice = {
  id: string;
  label: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  issued_at: string;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  stripe_invoice_id: string | null;
  stripe_checkout_session_id: string | null;
};

type AdminUsageEvent = {
  id: string;
  feature_key: string;
  event_type: string;
  quantity: number;
  created_at: string;
};

type AdminDictationSession = {
  id: string;
  title: string | null;
  language: string | null;
  cefr_level: string | null;
  accuracy: number | null;
  status: string | null;
  created_at: string;
};

type AdminShadowingSession = {
  id: string;
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

type AdminLessonProgress = {
  id: string;
  language: string;
  level_number: number;
  lesson_id: string;
  status: string;
  overall_score: number | null;
  updated_at: string;
};

type AdminExerciseAttempt = {
  id: string;
  language: string;
  lesson_id: string;
  exercise_type: string;
  skill: string;
  score: number;
  created_at: string;
};

type AdminReviewItem = {
  id: string;
  language: string;
  item_type: string;
  item_key: string;
  reason: string;
  due_at: string;
  status: string;
};

type AdminTextItem = {
  id: string;
  title: string;
  level: string | null;
  created_at: string;
};

type AdminCertificate = {
  id: string;
  title: string;
  score: number;
  language: string | null;
  cefr_level: string | null;
  issued_at: string;
};

const EMPTY_AI_PERIOD: AiUsagePeriod = { generations: 0, estimatedCostCents: 0 };

export default function AdminUserPage() {
  const { language, t, translateLanguageName } = useI18n();
  const { userId } = useParams();
  const { session } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUser({ quiet = false } = {}) {
    if (!userId || !session?.access_token) return;

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetchApi(`/api/admin/users/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error ?? t('user.unableLoad'));
      setDetail(payload as AdminUserDetail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('user.unableLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, [userId, session?.access_token]);

  const displayName = detail?.user.profile?.full_name || detail?.user.auth.email || t('user.fallbackTitle');
  const targetSummary = [
    detail?.user.profile?.native_language,
    detail?.user.profile?.target_language,
    detail?.user.profile?.cefr_level,
    detail?.user.profile?.goal_cefr_level,
  ].filter(Boolean);
  const aiSummary = detail?.aiUsage.summary;
  const recentLearning = useMemo(() => {
    if (!detail) return [];
    return [
      ...detail.learning.dictationSessions.map((row) => ({
        id: `dictation-${row.id}`,
        title: row.title ?? t('nav.history.dictationSession'),
        meta: `${translateLanguageName(row.language)} / ${row.cefr_level ?? t('admin.noLevel')}`,
        score: row.accuracy,
        date: row.created_at,
      })),
      ...detail.learning.shadowingSessions.map((row) => ({
        id: `shadowing-${row.id}`,
        title: row.title ?? t('admin.shadowingLesson'),
        meta: `${translateLanguageName(row.language)} / ${row.cefr_level ?? t('admin.noLevel')}`,
        score: row.average_score,
        date: row.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [detail, t, translateLanguageName]);

  return (
    <main className="wp-shell min-h-screen pt-24 pb-16 sm:pb-20">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-dim">
            <ArrowLeft className="h-4 w-4" />
            {t('user.backToAdmin')}
          </Link>
          <div className="mt-5 flex w-fit items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <UserRound className="h-4 w-4" />
            {t('user.profileBadge')}
          </div>
          <h1 className="mt-5 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">{displayName}</h1>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            {t('user.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadUser({ quiet: true })}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </header>

      {error && (
        <section className="mb-8 rounded-2xl border border-error/20 bg-error/10 px-5 py-4 text-sm text-on-surface">
          <p className="font-bold">{t('user.errorTitle')}</p>
          <p className="mt-1 text-on-surface-variant">{error}</p>
        </section>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center gap-3 rounded-[2rem] bg-surface-container-lowest text-on-surface-variant whisper-shadow">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="font-semibold">{t('user.loading')}</span>
        </div>
      ) : detail ? (
        <div className="space-y-8">
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="rounded-[2rem] bg-primary p-6 text-on-primary whisper-shadow xl:col-span-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary-container">{t('user.account')}</p>
              <h2 className="mt-3 truncate font-headline text-2xl font-black">{displayName}</h2>
              <p className="mt-2 truncate text-sm text-on-primary/80">{detail.user.auth.email ?? t('common.noEmail')}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniDetail dark label={t('common.status')} value={detail.user.auth.blocked || detail.user.profile?.is_blocked ? t('common.blocked') : t('common.active')} />
                <MiniDetail dark label={t('admin.joined')} value={formatDate(detail.user.auth.createdAt ?? detail.user.profile?.created_at, language)} />
                <MiniDetail dark label={t('user.lastSignIn')} value={formatDate(detail.user.auth.lastSignInAt, language)} />
                <MiniDetail dark label={t('common.provider')} value={detail.user.auth.providers?.join(', ') || t('common.email')} />
              </div>
            </div>
            <div className="rounded-[2rem] bg-surface-container-lowest p-6 whisper-shadow xl:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label={t('admin.paidRevenue')} value={formatMoney(detail.metrics.revenueCents)} icon={<CreditCard className="h-5 w-5" />} />
                <MetricCard label={t('admin.aiUsage')} value={formatMoneyFromCents(detail.metrics.aiEstimatedCostCents)} icon={<Sparkles className="h-5 w-5" />} />
                <MetricCard label={t('admin.dictationAvg')} value={scoreValue(detail.metrics.dictationAverageScore)} icon={<Gauge className="h-5 w-5" />} />
                <MetricCard label={t('admin.shadowingAvg')} value={scoreValue(detail.metrics.shadowingAverageScore)} icon={<Mic2 className="h-5 w-5" />} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniDetail label={t('user.native')} value={translateLanguageName(detail.user.profile?.native_language)} />
                <MiniDetail label={t('user.learning')} value={translateLanguageName(detail.user.profile?.target_language)} />
                <MiniDetail label={t('user.currentLevel')} value={detail.user.profile?.cefr_level ?? t('common.notSet')} />
                <MiniDetail label={t('user.goalLevel')} value={detail.user.profile?.goal_cefr_level ?? t('common.notSet')} />
              </div>
              {targetSummary.length === 0 && <p className="mt-4 text-sm text-on-surface-variant">{t('user.setupMissing')}</p>}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-7">
              <Panel title={t('user.billing')} actionLabel={t('user.paidInvoices', { count: detail.metrics.paidInvoices })}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PlanCard plan={detail.user.plan} />
                  <MetricCard label={t('user.subscriptions')} value={String(detail.metrics.subscriptions)} icon={<BadgeCheck className="h-5 w-5" />} />
                  <MetricCard label={t('user.certificates')} value={String(detail.metrics.certificates)} icon={<FileText className="h-5 w-5" />} />
                </div>
                <InvoiceList invoices={detail.billing.invoices} />
              </Panel>

              <Panel title={t('user.learningProgress')} actionLabel={t('user.lessons', { done: detail.metrics.curriculumPassedLessons, total: detail.metrics.curriculumLessons })}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label={t('user.exercises')} value={String(detail.metrics.exerciseAttempts)} icon={<Target className="h-5 w-5" />} />
                  <MetricCard label={t('admin.savedTexts')} value={String(detail.metrics.savedTexts)} icon={<BookOpen className="h-5 w-5" />} />
                  <MetricCard label={t('user.generatedTexts')} value={String(detail.metrics.generatedTexts)} icon={<Sparkles className="h-5 w-5" />} />
                </div>
                <RecordList
                  rows={recentLearning.map((item) => ({
                    id: item.id,
                    title: item.title,
                    meta: `${item.meta} - ${formatDate(item.date, language)}`,
                    value: scoreValue(item.score),
                  }))}
                  emptyLabel={t('user.noLearning')}
                />
              </Panel>
            </div>

            <div className="space-y-6 xl:col-span-5">
              <Panel title={t('admin.aiUsage')} actionLabel={aiSummary?.provider ?? 'AI'}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AiCostCard title={t('user.thirtyDays')} period={aiSummary?.last30Days ?? EMPTY_AI_PERIOD} />
                  <AiCostCard title={t('user.allTime')} period={aiSummary?.allTime ?? EMPTY_AI_PERIOD} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MiniDetail label={t('admin.model')} value={aiSummary?.model ?? t('common.notSet')} />
                  <MiniDetail label={t('admin.perRequest')} value={formatMoneyFromCents(aiSummary?.estimatedCostPerGenerationCents ?? 0)} />
                </div>
                <RecordList
                  rows={detail.aiUsage.events.slice(0, 8).map((event) => ({
                    id: event.id,
                    title: event.feature_key.replaceAll('_', ' '),
                    meta: `${event.event_type} - ${formatDateTime(event.created_at, language)}`,
                    value: String(event.quantity),
                  }))}
                  emptyLabel={t('user.noAi')}
                />
              </Panel>

              <Panel title={t('user.subscriptions')} actionLabel={t('nav.history')}>
                <RecordList
                  rows={detail.billing.subscriptions.map((subscription) => ({
                    id: subscription.id,
                    title: subscription.plan_name,
                    meta: `${subscription.status} - ${formatDate(subscription.created_at, language)}`,
                    value: formatMoney(subscription.amount_cents, subscription.currency),
                  }))}
                  emptyLabel={t('user.noSubscriptions')}
                />
              </Panel>

              <Panel title={t('user.reviewQueue')} actionLabel={t('user.reviewItems', { count: detail.learning.reviewQueue.length })}>
                <RecordList
                  rows={detail.learning.reviewQueue.slice(0, 8).map((item) => ({
                    id: item.id,
                    title: item.item_key,
                    meta: `${item.language} / ${item.item_type} - ${item.reason}`,
                    value: item.status,
                  }))}
                  emptyLabel={t('user.noReview')}
                />
              </Panel>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Panel({ title, actionLabel, children }: { title: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-surface-container-lowest whisper-shadow">
      <div className="flex items-center justify-between gap-4 border-b border-surface-container px-5 py-5 sm:px-6">
        <h2 className="font-headline text-xl font-bold text-on-surface">{title}</h2>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{actionLabel}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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

function MiniDetail({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${dark ? 'bg-white/10' : 'bg-surface-container-low'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-primary-container' : 'text-on-surface-variant'}`}>{label}</p>
      <p className={`mt-1 truncate text-xs font-bold ${dark ? 'text-on-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}

function PlanCard({ plan }: { plan: AdminUserPlan }) {
  const { t } = useI18n();
  const paid = plan.amountCents > 0;
  return (
    <div className={`rounded-2xl p-4 ${paid ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${paid ? 'text-primary-container' : 'text-on-surface-variant'}`}>{t('user.currentPlan')}</p>
      <p className="mt-3 font-headline text-2xl font-black">{plan.name}</p>
      <p className={`mt-1 text-sm font-bold ${paid ? 'text-on-primary/80' : 'text-primary'}`}>
        {paid ? `${formatMoney(plan.amountCents, plan.currency)} ${plan.billingCycle ?? ''}`.trim() : t('common.noPaidPlan')}
      </p>
      <p className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${paid ? 'text-primary-container' : 'text-on-surface-variant'}`}>
        {plan.cancelAtPeriodEnd ? t('common.canceling') : plan.status}
      </p>
    </div>
  );
}

function AiCostCard({ title, period }: { title: string; period: AiUsagePeriod }) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <p className="mt-3 font-headline text-2xl font-black text-on-surface">{formatMoneyFromCents(period.estimatedCostCents)}</p>
      <p className="mt-1 text-sm font-bold text-primary">{t('user.generations', { count: period.generations })}</p>
    </div>
  );
}

function InvoiceList({ invoices }: { invoices: AdminInvoice[] }) {
  const { language, t } = useI18n();

  if (invoices.length === 0) {
    return <p className="mt-4 rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">{t('user.noInvoices')}</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {invoices.map((invoice) => {
        const invoiceStatus = invoice.payment_status ?? invoice.status ?? t('admin.unknown');
        return (
          <article key={invoice.id} className="rounded-2xl bg-surface-container-low p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-bold text-on-surface">{invoice.label ?? `${t('user.invoice')} ${invoice.id.slice(0, 8)}`}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{t('user.internalId', { id: invoice.id.slice(0, 8) })}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-headline text-xl font-black text-on-surface">{formatMoney(invoice.amount_cents ?? 0, invoice.currency ?? 'usd')}</p>
                <span className="mt-2 inline-flex rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {invoiceStatus}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniDetail label={t('user.issued')} value={formatDateTime(invoice.issued_at, language)} />
              <MiniDetail label={t('user.paid')} value={formatDateTime(invoice.paid_at, language)} />
              <MiniDetail label={t('common.status')} value={invoice.status ?? t('admin.unknown')} />
              <MiniDetail label={t('user.payment')} value={invoice.payment_status ?? t('admin.unknown')} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MiniDetail label={t('user.stripeInvoice')} value={invoice.stripe_invoice_id ?? t('user.notLinked')} />
              <MiniDetail label={t('user.checkoutSession')} value={invoice.stripe_checkout_session_id ?? t('user.notLinked')} />
            </div>

            {(invoice.hosted_invoice_url || invoice.invoice_pdf_url) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {invoice.hosted_invoice_url && (
                  <a
                    href={invoice.hosted_invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition hover:bg-primary-dim"
                  >
                    {t('user.openInvoice')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {invoice.invoice_pdf_url && (
                  <a
                    href={invoice.invoice_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface transition hover:text-primary"
                  >
                    {t('user.invoicePdf')}
                    <ReceiptText className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function RecordList({ rows, emptyLabel }: { rows: Array<{ id: string; title: string; meta: string; value: string; href?: string }>; emptyLabel: string }) {
  return (
    <div className="mt-4 space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
          <div className="min-w-0">
            {row.href ? (
              <a href={row.href} target="_blank" rel="noreferrer" className="truncate font-bold text-on-surface hover:text-primary hover:underline">
                {row.title}
              </a>
            ) : (
              <p className="truncate font-bold text-on-surface">{row.title}</p>
            )}
            <p className="mt-1 truncate text-xs text-on-surface-variant">{row.meta}</p>
          </div>
          <span className="shrink-0 text-sm font-black text-primary">{row.value}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">{emptyLabel}</p>}
    </div>
  );
}

function scoreValue(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}%` : '--';
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
  if (!value) return '--';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--';
  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value?: string | null, language: 'en' | 'de' = 'en') {
  if (!value) return '--';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--';
  return date.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Admin API returned a non-JSON response. Restart the local server and try again.');
  }

  const text = await response.text();
  return text.trim() ? JSON.parse(text) : {};
}
