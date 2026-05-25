import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing STRIPE_SECRET_KEY, VITE_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const sessions = await listPaidCheckoutSessions();
let synced = 0;

for (const session of sessions) {
  const userId = session.client_reference_id;
  if (!userId) {
    continue;
  }

  const subscription = typeof session.subscription === 'object' ? session.subscription : null;
  const invoice = typeof session.invoice === 'object' ? session.invoice : null;
  const amountCents = session.amount_total ?? 1200;
  const currency = session.currency ?? 'usd';
  const recoveredAt = toIso(session.created) ?? new Date().toISOString();
  const periodStart = toIso(subscription?.current_period_start ?? invoice?.period_start) ?? recoveredAt;
  const periodEnd = normalizeActivePeriodEnd(toIso(subscription?.current_period_end ?? invoice?.period_end));
  const paidAt = toIso(invoice?.status_transitions?.paid_at ?? session.created) ?? new Date().toISOString();
  const subscriptionStatus = subscription?.status ?? 'active';

  const subscriptionPayload = {
    user_id: userId,
    plan_name: 'WordPilot Pro',
    status: subscriptionStatus,
    billing_cycle: 'monthly',
    amount_cents: amountCents,
    currency,
    payment_status: session.payment_status,
    stripe_customer_id: valueId(session.customer),
    stripe_subscription_id: valueId(session.subscription),
    stripe_checkout_session_id: session.id,
    stripe_price_id: subscription?.items?.data?.[0]?.price?.id ?? null,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    renewal_date: periodEnd,
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    canceled_at: toIso(subscription?.canceled_at),
    trial_end: toIso(subscription?.trial_end),
    metadata: {
      checkout_status: session.status,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      recovered_from_stripe: true,
    },
    created_at: recoveredAt,
    updated_at: new Date().toISOString(),
  };

  const { data: subscriptionRows, error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionPayload, { onConflict: 'stripe_checkout_session_id' })
    .select('id')
    .limit(1);

  if (subscriptionError) {
    throw subscriptionError;
  }

  const subscriptionId = subscriptionRows?.[0]?.id ?? null;
  const invoicePayload = {
    user_id: userId,
    subscription_id: subscriptionId,
    label: `WordPilot Pro checkout ${session.id.slice(-8)}`,
    amount_cents: amountCents,
    currency,
    status: invoice?.status === 'open' ? 'upcoming' : 'paid',
    payment_status: session.payment_status,
    stripe_invoice_id: valueId(session.invoice),
    stripe_checkout_session_id: session.id,
    stripe_customer_id: valueId(session.customer),
    stripe_subscription_id: valueId(session.subscription),
    hosted_invoice_url: invoice?.hosted_invoice_url ?? null,
    invoice_pdf_url: invoice?.invoice_pdf ?? null,
    period_start: periodStart,
    period_end: periodEnd,
    paid_at: paidAt,
    issued_at: paidAt,
    metadata: {
      checkout_status: session.status,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      recovered_from_stripe: true,
    },
    updated_at: new Date().toISOString(),
    created_at: paidAt,
  };

  const { error: invoiceError } = await supabase
    .from('billing_invoices')
    .upsert(invoicePayload, { onConflict: 'stripe_checkout_session_id' });

  if (invoiceError) {
    throw invoiceError;
  }

  synced += 1;
}

console.log(`Synced ${synced} paid checkout session(s).`);

async function listPaidCheckoutSessions() {
  const params = new URLSearchParams({
    limit: '100',
    'expand[]': 'data.subscription',
  });
  params.append('expand[]', 'data.invoice');

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Unable to list Stripe checkout sessions.');
  }

  return payload.data.filter(
    (session) => session.status === 'complete' && session.payment_status === 'paid',
  );
}

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(Number(value) * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function nextMonthIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function normalizeActivePeriodEnd(value) {
  if (!value || new Date(value).getTime() <= Date.now()) {
    return nextMonthIso();
  }

  return value;
}

function valueId(value) {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.id ?? null;
}
