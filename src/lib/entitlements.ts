export type PlanKey = 'free' | 'pro';

export type EntitlementSnapshot = {
  plan: PlanKey;
  planName: string;
  isPro: boolean;
  limits: {
    aiGenerationsMonthly: number | null;
    savedTexts: number | null;
    savedSessions: number | null;
  };
  usage: {
    aiGenerationsThisMonth: number;
    savedTexts: number;
    savedSessions: number;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  resolved: boolean;
};

export const FREE_LIMITS = {
  aiGenerationsMonthly: 3,
  savedTexts: 3,
  savedSessions: 5,
};

export const PRO_LIMITS = {
  aiGenerationsMonthly: null,
  savedTexts: null,
  savedSessions: null,
};

export function isActivePaidSubscription(
  subscription:
    | {
        plan_name?: string | null;
        status?: string | null;
        payment_status?: string | null;
        current_period_end?: string | null;
        renewal_date?: string | null;
        stripe_subscription_id?: string | null;
        stripe_checkout_session_id?: string | null;
      }
    | null
    | undefined,
) {
  if (!subscription) {
    return false;
  }

  const status = (subscription.status ?? '').toLowerCase();
  const paymentStatus = (subscription.payment_status ?? '').toLowerCase();
  const planName = (subscription.plan_name ?? '').toLowerCase();
  const hasFutureAccess =
    isFutureDate(subscription.current_period_end) || isFutureDate(subscription.renewal_date);
  const hasStripeRecord = Boolean(subscription.stripe_subscription_id || subscription.stripe_checkout_session_id);
  const paidStatuses = ['active', 'trialing', 'paid', 'complete', 'completed', 'succeeded'];
  const blockedStatuses = ['canceled', 'cancelled', 'unpaid', 'past_due', 'incomplete_expired'];

  if (blockedStatuses.includes(status)) {
    return false;
  }

  return planName.includes('pro') && (paidStatuses.includes(status) || paidStatuses.includes(paymentStatus) || hasFutureAccess || hasStripeRecord);
}

export function isPaidBillingInvoice(
  invoice:
    | {
        status?: string | null;
        payment_status?: string | null;
        period_end?: string | null;
        paid_at?: string | null;
        stripe_checkout_session_id?: string | null;
        stripe_invoice_id?: string | null;
      }
    | null
    | undefined,
) {
  if (!invoice) {
    return false;
  }

  const status = (invoice.status ?? '').toLowerCase();
  const paymentStatus = (invoice.payment_status ?? '').toLowerCase();
  const paidStatuses = ['paid', 'complete', 'completed', 'succeeded'];

  return (
    paidStatuses.includes(status) ||
    paidStatuses.includes(paymentStatus) ||
    Boolean(invoice.paid_at && (invoice.stripe_checkout_session_id || invoice.stripe_invoice_id)) ||
    isFutureDate(invoice.period_end)
  );
}

export function buildEntitlementSnapshot({
  isPro,
  usage,
  resolved = true,
}: {
  isPro: boolean;
  usage: EntitlementSnapshot['usage'];
  resolved?: boolean;
}): EntitlementSnapshot {
  return {
    plan: isPro ? 'pro' : 'free',
    planName: isPro ? 'WordPilot Pro' : 'Essential Free',
    isPro,
    limits: isPro ? PRO_LIMITS : FREE_LIMITS,
    usage,
    currentPeriodStart: getMonthStartIso(),
    currentPeriodEnd: getNextMonthStartIso(),
    resolved,
  };
}

export function isLimitReached(current: number, limit: number | null) {
  return limit !== null && current >= limit;
}

export function formatUsage(current: number, limit: number | null) {
  return limit === null ? `${current} / unlimited` : `${current} / ${limit}`;
}

export function getMonthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function getNextMonthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

export function formatMonthlyResetDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isFutureDate(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > Date.now();
}

const ENTITLEMENT_CACHE_KEY_PREFIX = 'wordpilot-entitlements-v1';

export function readCachedEntitlement(userId?: string | null) {
  if (!userId || typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(`${ENTITLEMENT_CACHE_KEY_PREFIX}-${userId}`);
    if (!rawValue) {
      return null;
    }

    const cached = JSON.parse(rawValue) as { isPro?: boolean; expiresAt?: string };
    if (!cached.expiresAt || new Date(cached.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem(`${ENTITLEMENT_CACHE_KEY_PREFIX}-${userId}`);
      return null;
    }

    return cached.isPro === true ? 'pro' : 'free';
  } catch {
    return null;
  }
}

export function writeCachedEntitlement(userId: string, isPro: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    `${ENTITLEMENT_CACHE_KEY_PREFIX}-${userId}`,
    JSON.stringify({
      isPro,
      expiresAt: getNextMonthStartIso(),
    }),
  );
}
