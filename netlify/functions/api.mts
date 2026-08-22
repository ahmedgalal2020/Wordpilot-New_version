import type { Buffer } from 'node:buffer';

declare const Netlify: { env: { get(key: string): string | undefined } } | undefined;

type AuthenticatedUser = {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type JsonResponseInit = ResponseInit & {
  headers?: HeadersInit;
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

const WINDOW_MS = 60_000;
const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const originCheck = rejectUntrustedOrigin(req);
  if (originCheck) return originCheck;

  const rateLimit = checkRateLimit(req);
  if (rateLimit) return rateLimit;

  const url = new URL(req.url);
  const path = normalizeApiPath(url.pathname);

  try {
    if (req.method === 'POST' && path === '/api/stripe/create-checkout-session') {
      return createCheckoutSession(req);
    }

    if (req.method === 'GET' && path === '/api/stripe/checkout-session') {
      return getCheckoutSession(req, url);
    }

    if (req.method === 'POST' && path === '/api/billing/sync-checkout') {
      return syncCheckout(req);
    }

    if (req.method === 'POST' && path === '/api/billing/send-receipt') {
      return sendReceipt(req);
    }

    if (req.method === 'POST' && path === '/api/ai/generate') {
      return generateAiText(req);
    }

    if (req.method === 'GET' && path === '/api/admin/access') {
      return adminAccess(req);
    }

    if (req.method === 'GET' && path === '/api/admin/overview') {
      return adminOverview(req, url);
    }

    if (req.method === 'POST' && path === '/api/admin/admin-users') {
      return addAdminUser(req);
    }

    const revokeMatch = path.match(/^\/api\/admin\/admin-users\/([^/]+)\/revoke$/);
    if (req.method === 'POST' && revokeMatch) {
      return revokeAdminUser(req, revokeMatch[1]);
    }

    const blockMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/block$/);
    if (req.method === 'POST' && blockMatch) {
      return blockUser(req, blockMatch[1]);
    }

    const cancelMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/cancel-subscription$/);
    if (req.method === 'POST' && cancelMatch) {
      return cancelUserSubscription(req, cancelMatch[1]);
    }

    const resetMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/reset-password$/);
    if (req.method === 'POST' && resetMatch) {
      return resetUserPassword(req, resetMatch[1]);
    }

    if (req.method === 'POST' && path === '/api/stripe/webhook') {
      return json({ error: 'Stripe webhook handling still needs event verification and fulfillment logic.' }, { status: 501 });
    }

    return json({ error: `API route not found: ${path}` }, { status: 404 });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected API error.' },
      { status: 500 },
    );
  }
}

export const config = {
  path: '/api/*',
};

async function createCheckoutSession(req: Request) {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return json({ error: 'Stripe secret key is not configured.' }, { status: 500 });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) return json({ error: userContext.error }, { status: userContext.status });
  if (isUserBlocked(userContext.user)) return json({ error: 'This account is blocked.' }, { status: 403 });

  const origin = getRequestOrigin(req);
  const sessionParams = new URLSearchParams({
    mode: 'subscription',
    success_url: `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': '1200',
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][price_data][product_data][name]': 'WordPilot Pro',
    allow_promotion_codes: 'true',
  });

  sessionParams.set('client_reference_id', userContext.user.id);
  sessionParams.set('metadata[user_id]', userContext.user.id);
  if (userContext.user.email) sessionParams.set('customer_email', userContext.user.email);

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: sessionParams,
  });
  const payload = await stripeResponse.json();

  if (!stripeResponse.ok || !payload.url) {
    return json({ error: payload?.error?.message ?? 'Unable to create Stripe Checkout session.' }, { status: stripeResponse.status });
  }

  return json({ url: payload.url });
}

async function getCheckoutSession(req: Request, url: URL) {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) return json({ error: 'Stripe secret key is not configured.' }, { status: 500 });

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) return json({ error: userContext.error }, { status: userContext.status });

  const sessionId = url.searchParams.get('session_id') ?? '';
  if (!sessionId.startsWith('cs_')) return json({ error: 'A valid checkout session id is required.' }, { status: 400 });

  const checkout = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
  if (!checkout.ok) return json({ error: checkout.error }, { status: checkout.status });

  const payload = checkout.payload;
  const summary = buildCheckoutSummary(
    payload,
    typeof payload.subscription === 'object' ? payload.subscription : null,
    typeof payload.invoice === 'object' ? payload.invoice : null,
  );

  if (summary.clientReferenceId !== userContext.user.id) {
    return json({ error: 'This checkout session belongs to a different account.' }, { status: 403 });
  }

  return json(summary);
}

async function syncCheckout(req: Request) {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) return json({ error: 'Stripe secret key is not configured.' }, { status: 500 });

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) return json({ error: userContext.error }, { status: userContext.status });
  if (isUserBlocked(userContext.user)) return json({ error: 'This account is blocked.' }, { status: 403 });

  const { sessionId } = await readJson<{ sessionId?: string }>(req);
  if (!sessionId?.startsWith('cs_')) return json({ error: 'A valid checkout session id is required.' }, { status: 400 });

  const checkout = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
  if (!checkout.ok) return json({ error: checkout.error }, { status: checkout.status });

  const payload = checkout.payload;
  const summary = buildCheckoutSummary(
    payload,
    typeof payload.subscription === 'object' ? payload.subscription : null,
    typeof payload.invoice === 'object' ? payload.invoice : null,
  );

  if (summary.clientReferenceId !== userContext.user.id) {
    return json({ error: 'This checkout session belongs to a different account.' }, { status: 403 });
  }

  const paid = summary.status === 'complete' || summary.paymentStatus === 'paid';
  if (!paid) return json({ error: 'Stripe has not marked this checkout as paid yet.', checkout: summary }, { status: 409 });

  const database = await syncCheckoutToSupabase(userContext.user.id, summary);
  return json({ checkout: summary, database });
}

async function sendReceipt(req: Request) {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) return json({ error: 'Stripe secret key is not configured.' }, { status: 500 });

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) return json({ error: userContext.error }, { status: userContext.status });

  const resendApiKey = getEnv('RESEND_API_KEY')?.trim();
  if (!resendApiKey) return json({ sent: false, skipped: true, reason: 'RESEND_API_KEY is not configured.' });

  const { sessionId } = await readJson<{ sessionId?: string }>(req);
  if (!sessionId?.startsWith('cs_')) return json({ error: 'A valid checkout session id is required.' }, { status: 400 });

  const checkout = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
  if (!checkout.ok) return json({ error: checkout.error }, { status: checkout.status });

  const payload = checkout.payload;
  const subscription = typeof payload.subscription === 'object' ? payload.subscription : null;
  const summary = buildCheckoutSummary(payload, subscription, typeof payload.invoice === 'object' ? payload.invoice : null);
  const recipient = payload.customer_details?.email ?? payload.customer_email;
  const paid = payload.status === 'complete' || payload.payment_status === 'paid';

  if (summary.clientReferenceId !== userContext.user.id) return json({ error: 'This checkout session belongs to a different account.' }, { status: 403 });
  if (!paid) return json({ error: 'Checkout is not paid yet.' }, { status: 409 });
  if (!recipient) return json({ error: 'Stripe checkout session has no customer email.' }, { status: 400 });

  const amountLabel = formatCurrency(payload.amount_total ?? 1200, payload.currency ?? 'usd');
  const renewalDate = subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : getFallbackRenewalDate();
  const renewalLabel = renewalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEnv('BILLING_EMAIL_FROM')?.trim() || 'WordPilot <onboarding@resend.dev>',
      to: recipient,
      subject: 'Your WordPilot Pro payment was confirmed',
      html: buildReceiptEmailHtml({ amountLabel, renewalLabel, checkoutId: payload.id }),
    }),
  });
  const emailPayload = await emailResponse.json().catch(() => ({}));

  if (!emailResponse.ok) return json({ error: emailPayload?.message ?? 'Unable to send billing receipt email.' }, { status: emailResponse.status });
  return json({ sent: true, id: emailPayload.id });
}

async function generateAiText(req: Request) {
  const geminiApiKey = getEnv('GEMINI_API_KEY')?.trim();
  if (!geminiApiKey) return json({ error: 'Cloud AI generation is not configured.' }, { status: 503 });

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) return json({ error: userContext.error }, { status: userContext.status });
  if (isUserBlocked(userContext.user)) return json({ error: 'This account is blocked.' }, { status: 403 });

  const { prompt } = await readJson<{ prompt?: string }>(req);
  const cleanPrompt = String(prompt ?? '').trim();
  if (cleanPrompt.length < 20 || cleanPrompt.length > 8_000) {
    return json({ error: 'Prompt length must be between 20 and 8000 characters.' }, { status: 400 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: cleanPrompt }] }] }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: payload?.error?.message ?? 'Unable to generate text.' }, { status: response.status });

  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim();
  return json({ text: text ?? '' });
}

async function adminAccess(req: Request) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });
  return json({ isAdmin: true, admin: { email: adminContext.admin.email, role: adminContext.admin.role } });
}

async function adminOverview(req: Request, url: URL) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });

  const userSearch = (url.searchParams.get('userSearch') ?? '').trim();
  const usersQuery = buildAdminUsersQuery(userSearch);
  const { supabaseUrl, serviceRoleKey } = adminContext;

  const [
    usersCount,
    sessionsCount,
    savedTextsCount,
    certificatesCount,
    subscriptionsCount,
    activeSubscriptionsRows,
    paidInvoicesCount,
    recentUsers,
    recentInvoices,
    invoiceRevenue,
    recentSessions,
    billingProfiles,
    authUsersResult,
  ] = await Promise.all([
    supabaseCount(supabaseUrl, serviceRoleKey, 'profiles'),
    supabaseCount(supabaseUrl, serviceRoleKey, 'dictation_sessions'),
    supabaseCount(supabaseUrl, serviceRoleKey, 'saved_texts'),
    supabaseCount(supabaseUrl, serviceRoleKey, 'certificates'),
    supabaseCount(supabaseUrl, serviceRoleKey, 'user_subscriptions'),
    supabaseRest(supabaseUrl, serviceRoleKey, 'user_subscriptions', {
      method: 'GET',
      query: 'select=user_id&status=in.(active,trialing,paid,complete,completed,succeeded)&limit=1000',
    }),
    supabaseCount(supabaseUrl, serviceRoleKey, 'billing_invoices', 'or=(status.in.(paid,complete,completed,succeeded),payment_status.in.(paid,complete,completed,succeeded))'),
    supabaseRest(supabaseUrl, serviceRoleKey, 'profiles', { method: 'GET', query: usersQuery }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
      method: 'GET',
      query: 'select=id,user_id,label,amount_cents,currency,status,payment_status,issued_at,paid_at,hosted_invoice_url,invoice_pdf_url&order=issued_at.desc&limit=10',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
      method: 'GET',
      query: 'select=amount_cents,currency,status,payment_status,issued_at,paid_at&limit=1000',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'dictation_sessions', {
      method: 'GET',
      query: 'select=id,user_id,title,language,accuracy,created_at&order=created_at.desc&limit=10',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'profiles', { method: 'GET', query: 'select=id,email,full_name&limit=1000' }),
    fetchAuthAdminUsers(supabaseUrl, serviceRoleKey),
  ]);

  const critical = [usersCount, sessionsCount, savedTextsCount, recentUsers, recentSessions, billingProfiles, authUsersResult].find((result) => !result.ok);
  if (critical && !critical.ok) return json({ error: critical.error }, { status: critical.status ?? 500 });

  const optionalWarnings = [certificatesCount, subscriptionsCount, activeSubscriptionsRows, paidInvoicesCount, recentInvoices, invoiceRevenue]
    .filter((result) => !result.ok)
    .map((result) => result.error)
    .filter(Boolean);

  const invoicesForRevenue = Array.isArray(invoiceRevenue.data) ? invoiceRevenue.data : [];
  const activeSubscriberIds = new Set((Array.isArray(activeSubscriptionsRows.data) ? activeSubscriptionsRows.data : []).map((subscription: any) => subscription.user_id).filter(Boolean));
  const paidRevenueInvoices = invoicesForRevenue.filter(isPaidRevenueInvoice);
  const profileById = new Map((Array.isArray(billingProfiles.data) ? billingProfiles.data : []).map((profile: any) => [profile.id, profile]));
  const todayStart = getLocalDayStart(new Date()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const paidToday = paidRevenueInvoices.filter((invoice: any) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    return timestamp >= todayStart && timestamp < tomorrowStart;
  });
  const paidYesterday = paidRevenueInvoices.filter((invoice: any) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    return timestamp >= yesterdayStart && timestamp < todayStart;
  });
  const authUsers = authUsersResult.users ?? [];
  const authUsersById = new Map(authUsers.map((authUser: any) => [authUser.id, authUser]));
  const recentProfiles = (recentUsers.data ?? []).map((profile: any) => {
    const authUser = authUsersById.get(profile.id) as any;
    return {
      ...profile,
      is_blocked: isAuthUserBlocked(authUser),
      blocked_reason: authUser?.user_metadata?.blocked_reason ?? authUser?.app_metadata?.blocked_reason ?? null,
      blocked_at: authUser?.banned_until ?? null,
    };
  });
  const adminUsers = authUsers
    .filter((authUser: any) => authUser.app_metadata?.role === 'admin' || authUser.app_metadata?.admin_status === 'active')
    .map((authUser: any) => ({
      user_id: authUser.id,
      email: authUser.email,
      role: authUser.app_metadata?.admin_role ?? 'admin',
      status: authUser.app_metadata?.admin_status ?? 'active',
      created_at: authUser.app_metadata?.admin_granted_at ?? authUser.created_at,
      revoked_at: authUser.app_metadata?.admin_revoked_at ?? null,
    }));

  return json({
    generatedAt: new Date().toISOString(),
    admin: { email: adminContext.admin.email, role: adminContext.admin.role },
    metrics: {
      users: usersCount.count,
      subscriptions: subscriptionsCount.count,
      activeSubscriptions: activeSubscriberIds.size,
      paidInvoices: paidInvoicesCount.count,
      revenueCents: paidRevenueInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.amount_cents ?? 0), 0),
      revenueLast30DaysCents: paidRevenueInvoices
        .filter((invoice: any) => {
          const timestamp = new Date(invoice.paid_at ?? invoice.issued_at ?? '').getTime();
          return Number.isFinite(timestamp) && timestamp >= thirtyDaysAgo;
        })
        .reduce((sum: number, invoice: any) => sum + Number(invoice.amount_cents ?? 0), 0),
      sessions: sessionsCount.count,
      savedTexts: savedTextsCount.count,
      certificates: certificatesCount.count,
    },
    billingSummary: {
      today: { paidInvoices: paidToday.length, revenueCents: paidToday.reduce((sum: number, invoice: any) => sum + Number(invoice.amount_cents ?? 0), 0) },
      yesterday: { paidInvoices: paidYesterday.length, revenueCents: paidYesterday.reduce((sum: number, invoice: any) => sum + Number(invoice.amount_cents ?? 0), 0) },
      last30Days: buildRevenueChart(paidRevenueInvoices),
      recentPayers: { today: buildPayerRows(paidToday, profileById), yesterday: buildPayerRows(paidYesterday, profileById) },
    },
    userSearch,
    recentUsers: recentProfiles,
    recentInvoices: recentInvoices.data ?? [],
    recentSessions: recentSessions.data ?? [],
    adminUsers,
    warnings: optionalWarnings,
  });
}

async function addAdminUser(req: Request) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });

  const { email: rawEmail } = await readJson<{ email?: string }>(req);
  const email = String(rawEmail ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return json({ error: 'A valid user email is required.' }, { status: 400 });

  const profileResult = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'profiles', {
    method: 'GET',
    query: `select=id,email,full_name&email=eq.${encodeURIComponent(email)}&limit=1`,
  });
  if (!profileResult.ok) return json({ error: profileResult.error }, { status: profileResult.status });

  const profile = profileResult.data?.[0];
  if (!profile?.id) return json({ error: 'No registered user was found with this email.' }, { status: 404 });

  const result = await updateAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, profile.id, {
    app_metadata: {
      role: 'admin',
      admin_role: 'admin',
      admin_status: 'active',
      admin_granted_by: adminContext.admin.id,
      admin_granted_at: new Date().toISOString(),
      admin_revoked_at: null,
    },
  });
  if (!result.ok) return json({ error: result.error }, { status: result.status });
  return json({ adminUser: result.user ?? null });
}

async function revokeAdminUser(req: Request, targetUserId: string) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });
  if (targetUserId === adminContext.admin.id) return json({ error: 'You cannot revoke your own admin access.' }, { status: 400 });

  const authUsers = await fetchAuthAdminUsers(adminContext.supabaseUrl, adminContext.serviceRoleKey);
  if (!authUsers.ok) return json({ error: authUsers.error }, { status: authUsers.status });

  const activeAdmins = (authUsers.users ?? []).filter((authUser: any) => authUser.app_metadata?.role === 'admin' && authUser.app_metadata?.admin_status !== 'revoked');
  if (activeAdmins.length <= 1) return json({ error: 'At least one active admin must remain.' }, { status: 400 });

  const result = await updateAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId, {
    app_metadata: { role: 'user', admin_status: 'revoked', admin_revoked_by: adminContext.admin.id, admin_revoked_at: new Date().toISOString() },
  });
  if (!result.ok) return json({ error: result.error }, { status: result.status });
  return json({ adminUser: result.user ?? null });
}

async function blockUser(req: Request, targetUserId: string) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });
  if (targetUserId === adminContext.admin.id) return json({ error: 'You cannot block your own admin account.' }, { status: 400 });

  const { blocked, reason } = await readJson<{ blocked?: boolean; reason?: string }>(req);
  const shouldBlock = blocked !== false;
  const cleanReason = String(reason ?? '').trim() || 'Blocked by admin';
  const result = await updateAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId, {
    ban_duration: shouldBlock ? '876000h' : 'none',
    user_metadata: {
      blocked_reason: shouldBlock ? cleanReason : null,
      blocked_by: shouldBlock ? adminContext.admin.id : null,
      blocked_at: shouldBlock ? new Date().toISOString() : null,
    },
    app_metadata: { blocked: shouldBlock, blocked_reason: shouldBlock ? cleanReason : null },
  });
  if (!result.ok) return json({ error: result.error }, { status: result.status });

  await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'profiles', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(targetUserId)}`,
    body: {
      is_blocked: shouldBlock,
      blocked_reason: shouldBlock ? cleanReason : null,
      blocked_at: shouldBlock ? new Date().toISOString() : null,
      blocked_by: shouldBlock ? adminContext.admin.id : null,
      updated_at: new Date().toISOString(),
    },
    headers: { Prefer: 'return=representation' },
  });

  return json({ user: result.user ?? null });
}

async function cancelUserSubscription(req: Request, targetUserId: string) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });

  const activeStatuses = 'active,trialing,paid,complete,completed,succeeded';
  const subscriptionsResult = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'user_subscriptions', {
    method: 'GET',
    query: `select=id,stripe_subscription_id,status&user_id=eq.${encodeURIComponent(targetUserId)}&status=in.(${activeStatuses})`,
  });
  if (!subscriptionsResult.ok) return json({ error: subscriptionsResult.error }, { status: subscriptionsResult.status });

  const stripeSecretKey = getStripeSecretKey();
  const stripeResults = [];
  for (const subscription of Array.isArray(subscriptionsResult.data) ? subscriptionsResult.data : []) {
    if (stripeSecretKey && subscription.stripe_subscription_id) {
      stripeResults.push(await cancelStripeSubscription(subscription.stripe_subscription_id, stripeSecretKey));
    }
  }

  const updated = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'user_subscriptions', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(targetUserId)}&status=in.(${activeStatuses})`,
    body: { status: 'canceled', payment_status: 'canceled', cancel_at_period_end: false, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    headers: { Prefer: 'return=representation' },
  });
  if (!updated.ok) return json({ error: updated.error }, { status: updated.status });
  return json({ canceledSubscriptions: updated.data ?? [], stripeResults });
}

async function resetUserPassword(req: Request, targetUserId: string) {
  const adminContext = await getAdminRequestContext(req);
  if (!adminContext.ok) return json({ error: adminContext.error }, { status: adminContext.status });

  const authUser = await fetchAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId);
  if (!authUser.ok) return json({ error: authUser.error }, { status: authUser.status });

  const email = authUser.user?.email;
  if (!email) return json({ error: 'This user does not have an email address for password reset.' }, { status: 400 });

  const anonKey = getEnv('SUPABASE_ANON_KEY')?.trim() || getEnv('VITE_SUPABASE_ANON_KEY')?.trim();
  if (!anonKey) return json({ error: 'SUPABASE_ANON_KEY is required to send password reset emails.' }, { status: 500 });

  const response = await fetch(`${adminContext.supabaseUrl.replace(/\/$/, '')}/auth/v1/recover`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirect_to: `${getRequestOrigin(req)}/reset-password` }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: payload?.msg ?? payload?.message ?? payload?.error ?? 'Unable to send password reset email.' }, { status: response.status });
  return json({ sent: true, email });
}

async function getAdminRequestContext(req: Request) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false as const, status: 500, error: 'Admin actions require SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.' };
  }

  const admin = await authenticateAdmin(req, supabaseUrl, serviceRoleKey);
  if (!admin.ok) return admin;
  return { ok: true as const, supabaseUrl, serviceRoleKey, admin };
}

async function authenticateAdmin(req: Request, supabaseUrl: string, serviceRoleKey: string) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, error: 'Admin authentication is required.' };

  const anonKey = getEnv('SUPABASE_ANON_KEY')?.trim() || getEnv('VITE_SUPABASE_ANON_KEY')?.trim();
  if (!anonKey) return { ok: false as const, status: 500, error: 'SUPABASE_ANON_KEY is required to verify admin sessions.' };

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false as const, status: 401, error: 'Admin session could not be verified.' };

  const email = String(user.email ?? '').toLowerCase();
  const id = String(user.id ?? '');

  if (user.app_metadata?.role === 'admin' && user.app_metadata?.admin_status !== 'revoked') {
    return { ok: true as const, email, id, role: user.app_metadata?.admin_role ?? 'admin' };
  }

  const dbAdminResult = await supabaseRest(supabaseUrl, serviceRoleKey, 'admin_users', {
    method: 'GET',
    query: `select=user_id,email,role,status&user_id=eq.${encodeURIComponent(id)}&status=eq.active&limit=1`,
  });
  if (dbAdminResult.ok && dbAdminResult.data?.[0]) {
    const adminRow = dbAdminResult.data[0];
    return { ok: true as const, email: adminRow.email ?? email, id, role: adminRow.role ?? 'admin' };
  }

  const emailAllowed = email && getConfiguredAdminEmails().includes(email);
  const idAllowed = id && getConfiguredAdminUserIds().includes(id);
  if (!emailAllowed && !idAllowed) return { ok: false as const, status: 403, error: 'This account is not allowed to view the admin dashboard.' };
  return { ok: true as const, email, id, role: 'bootstrap' };
}

async function getAuthenticatedUserContext(req: Request) {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getEnv('SUPABASE_ANON_KEY')?.trim() || getEnv('VITE_SUPABASE_ANON_KEY')?.trim();
  if (!supabaseUrl || !anonKey) return { ok: false as const, status: 500, error: 'Supabase auth is not configured.' };

  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, error: 'Authentication is required.' };

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  const user = await response.json().catch(() => null);
  if (!response.ok || !user?.id) return { ok: false as const, status: 401, error: 'Session could not be verified.' };

  return {
    ok: true as const,
    user: {
      id: String(user.id),
      email: String(user.email ?? ''),
      app_metadata: user.app_metadata ?? {},
      user_metadata: user.user_metadata ?? {},
    } satisfies AuthenticatedUser,
  };
}

function rejectUntrustedOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return null;
  const origin = req.headers.get('origin')?.replace(/\/$/, '');
  if (!origin) return null;
  if (!getAllowedOrigins(req).includes(origin)) return json({ error: 'Request origin is not allowed.' }, { status: 403 });
  return null;
}

function getAllowedOrigins(req: Request) {
  const configured = [getEnv('APP_URL'), getEnv('PUBLIC_APP_URL'), getEnv('SITE_URL'), ...(getEnv('ALLOWED_ORIGINS') ?? '').split(',')]
    .map((value) => value?.trim().replace(/\/$/, ''))
    .filter(Boolean) as string[];
  return Array.from(new Set([...configured, new URL(req.url).origin]));
}

function checkRateLimit(req: Request) {
  const path = normalizeApiPath(new URL(req.url).pathname);
  const max = path.startsWith('/api/ai') ? 8 : path.startsWith('/api/admin') || path.startsWith('/api/billing') || path.startsWith('/api/stripe') ? 20 : 120;
  const token = getBearerToken(req) ?? 'anonymous';
  const key = `${req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'}:${token}:${path}`;
  const now = Date.now();
  const current = rateLimitHits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitHits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  current.count += 1;
  if (current.count <= max) return null;
  return json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': Math.ceil((current.resetAt - now) / 1000).toString() } });
}

function normalizeApiPath(pathname: string) {
  const decoded = pathname.replace(/\/$/, '') || '/';
  const functionPrefix = '/.netlify/functions/api';
  if (decoded.startsWith(functionPrefix)) {
    const suffix = decoded.slice(functionPrefix.length);
    return suffix.startsWith('/api/') ? suffix : `/api${suffix}`;
  }
  return decoded;
}

function json(payload: unknown, init: JsonResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

async function readJson<T>(req: Request): Promise<T> {
  return (await req.json().catch(() => ({}))) as T;
}

function getEnv(key: string) {
  if (typeof Netlify !== 'undefined') return Netlify.env.get(key);
  return process.env[key];
}

function getSupabaseUrl() {
  return getEnv('SUPABASE_URL')?.trim() || getEnv('VITE_SUPABASE_URL')?.trim();
}

function getStripeSecretKey() {
  return getEnv('STRIPE_SECRET_KEY')?.trim();
}

function getRequestOrigin(req: Request) {
  const configuredOrigin = getEnv('APP_URL')?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');
  return new URL(req.url).origin;
}

function getBearerToken(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

function getConfiguredAdminEmails() {
  return (getEnv('ADMIN_EMAILS') ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

function getConfiguredAdminUserIds() {
  return (getEnv('ADMIN_USER_IDS') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
}

function isUserBlocked(user: AuthenticatedUser) {
  return user.app_metadata?.blocked === true;
}

function buildAdminUsersQuery(userSearch: string) {
  const baseSelect = 'select=id,email,full_name,target_language,cefr_level,created_at,updated_at';
  const baseQuery = `${baseSelect}&order=created_at.desc&limit=25`;
  if (!userSearch) return baseQuery;
  const escapedSearch = userSearch.replace(/[%*,()]/g, ' ').trim();
  if (!escapedSearch) return baseQuery;
  const pattern = encodeURIComponent(`*${escapedSearch}*`);
  return `${baseSelect}&or=(email.ilike.${pattern},full_name.ilike.${pattern})&order=created_at.desc&limit=25`;
}

function buildCheckoutSummary(payload: any, subscription: any, invoice: any) {
  const subscriptionId = subscription?.id ?? (typeof payload.subscription === 'string' ? payload.subscription : null);
  const invoiceId = invoice?.id ?? (typeof payload.invoice === 'string' ? payload.invoice : null);
  const price = subscription?.items?.data?.[0]?.price ?? null;
  return {
    id: payload.id,
    status: payload.status,
    paymentStatus: payload.payment_status,
    mode: payload.mode,
    clientReferenceId: payload.client_reference_id,
    customerId: typeof payload.customer === 'string' ? payload.customer : payload.customer?.id ?? null,
    customerEmail: payload.customer_details?.email ?? payload.customer_email ?? null,
    amountTotal: payload.amount_total ?? 1200,
    currency: payload.currency ?? 'usd',
    subscriptionId,
    subscriptionStatus: subscription?.status ?? null,
    currentPeriodStart: subscription?.current_period_start ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    canceledAt: subscription?.canceled_at ?? null,
    trialEnd: subscription?.trial_end ?? null,
    priceId: price?.id ?? null,
    invoiceId,
    invoiceStatus: invoice?.status ?? null,
    invoiceHostedUrl: invoice?.hosted_invoice_url ?? null,
    invoicePdfUrl: invoice?.invoice_pdf ?? null,
    paidAt: invoice?.status_transitions?.paid_at ?? null,
  };
}

async function fetchStripeCheckoutSession(sessionId: string, stripeSecretKey: string) {
  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription&expand[]=invoice`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const payload = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return { ok: false as const, status: stripeResponse.status, error: payload?.error?.message ?? 'Unable to retrieve Stripe Checkout session.' };
  }
  return { ok: true as const, payload };
}

async function syncCheckoutToSupabase(userId: string, checkout: ReturnType<typeof buildCheckoutSummary>) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!supabaseUrl || !serviceRoleKey) return { synced: false, skipped: true, reason: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Client fallback will be used.' };

  const periodStart = checkout.currentPeriodStart ? new Date(checkout.currentPeriodStart * 1000).toISOString() : null;
  const periodEnd = checkout.currentPeriodEnd ? new Date(checkout.currentPeriodEnd * 1000).toISOString() : getFallbackRenewalDate().toISOString();
  const paidAt = checkout.paidAt ? new Date(checkout.paidAt * 1000).toISOString() : new Date().toISOString();
  const subscriptionPayload = {
    user_id: userId,
    plan_name: 'WordPilot Pro',
    status: checkout.subscriptionStatus ?? 'active',
    billing_cycle: 'monthly',
    amount_cents: checkout.amountTotal ?? 1200,
    currency: checkout.currency ?? 'usd',
    payment_status: checkout.paymentStatus,
    stripe_customer_id: checkout.customerId,
    stripe_subscription_id: checkout.subscriptionId,
    stripe_checkout_session_id: checkout.id,
    stripe_price_id: checkout.priceId,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    renewal_date: periodEnd,
    cancel_at_period_end: checkout.cancelAtPeriodEnd,
    canceled_at: checkout.canceledAt ? new Date(checkout.canceledAt * 1000).toISOString() : null,
    trial_end: checkout.trialEnd ? new Date(checkout.trialEnd * 1000).toISOString() : null,
    metadata: { checkout_status: checkout.status, customer_email: checkout.customerEmail },
    updated_at: new Date().toISOString(),
  };

  const subscriptionResponse = await supabaseRest(supabaseUrl, serviceRoleKey, 'user_subscriptions', {
    method: 'POST',
    query: 'on_conflict=stripe_checkout_session_id',
    body: subscriptionPayload,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  if (!subscriptionResponse.ok) return { synced: false, skipped: false, error: subscriptionResponse.error };

  const subscriptionRow = subscriptionResponse.data?.[0] ?? null;
  const invoiceResponse = await supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
    method: 'POST',
    query: 'on_conflict=stripe_checkout_session_id',
    body: {
      user_id: userId,
      subscription_id: subscriptionRow?.id ?? null,
      label: `WordPilot Pro checkout ${checkout.id.slice(-8)}`,
      amount_cents: checkout.amountTotal ?? 1200,
      currency: checkout.currency ?? 'usd',
      status: checkout.invoiceStatus === 'open' ? 'upcoming' : 'paid',
      payment_status: checkout.paymentStatus,
      stripe_invoice_id: checkout.invoiceId,
      stripe_checkout_session_id: checkout.id,
      stripe_customer_id: checkout.customerId,
      stripe_subscription_id: checkout.subscriptionId,
      hosted_invoice_url: checkout.invoiceHostedUrl,
      invoice_pdf_url: checkout.invoicePdfUrl,
      period_start: periodStart,
      period_end: periodEnd,
      paid_at: paidAt,
      issued_at: paidAt,
      metadata: { checkout_status: checkout.status, customer_email: checkout.customerEmail },
      updated_at: new Date().toISOString(),
    },
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  if (!invoiceResponse.ok) return { synced: false, skipped: false, subscription: subscriptionRow, error: invoiceResponse.error };
  return { synced: true, skipped: false, subscription: subscriptionRow, invoice: invoiceResponse.data?.[0] ?? null };
}

async function supabaseRest(supabaseUrl: string, serviceRoleKey: string, table: string, options: { method: string; query?: string; body?: Record<string, unknown>; headers?: Record<string, string> }) {
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}${options.query ? `?${options.query}` : ''}`;
  const response = await fetch(url, {
    method: options.method,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) return { ok: false as const, status: response.status, error: data?.message ?? data?.error ?? text };
  return { ok: true as const, status: response.status, data };
}

async function supabaseCount(supabaseUrl: string, serviceRoleKey: string, table: string, query = '') {
  const countQuery = `select=id&limit=0${query ? `&${query}` : ''}`;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?${countQuery}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Prefer: 'count=exact' },
  });
  const text = await response.text();
  if (!response.ok) {
    const data = text ? JSON.parse(text) : null;
    return { ok: false as const, status: response.status, error: data?.message ?? data?.error ?? text, count: 0 };
  }
  const count = Number((response.headers.get('content-range') ?? '').split('/')[1] ?? 0);
  return { ok: true as const, status: response.status, count: Number.isFinite(count) ? count : 0 };
}

async function fetchAuthAdminUsers(supabaseUrl: string, serviceRoleKey: string) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const data = await response.json();
  if (!response.ok) return { ok: false as const, status: response.status, error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to load Supabase Auth users.', users: [] };
  return { ok: true as const, status: response.status, users: data.users ?? [] };
}

async function updateAuthUser(supabaseUrl: string, serviceRoleKey: string, userId: string, payload: Record<string, unknown>) {
  const currentUser = await fetchAuthUser(supabaseUrl, serviceRoleKey, userId);
  const nextPayload = { ...payload };
  if (currentUser.ok && payload.app_metadata && typeof payload.app_metadata === 'object') {
    nextPayload.app_metadata = { ...(currentUser.user?.app_metadata ?? {}), ...(payload.app_metadata as Record<string, unknown>) };
  }
  if (currentUser.ok && payload.user_metadata && typeof payload.user_metadata === 'object') {
    nextPayload.user_metadata = { ...(currentUser.user?.user_metadata ?? {}), ...(payload.user_metadata as Record<string, unknown>) };
  }
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(nextPayload),
  });
  const data = await response.json();
  if (!response.ok) return { ok: false as const, status: response.status, error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to update Supabase Auth user.', user: null };
  return { ok: true as const, status: response.status, user: data };
}

async function fetchAuthUser(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const data = await response.json();
  if (!response.ok) return { ok: false as const, status: response.status, error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to load Supabase Auth user.', user: null };
  return { ok: true as const, status: response.status, user: data };
}

async function cancelStripeSubscription(subscriptionId: string, stripeSecretKey: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const payload = await response.json();
  if (!response.ok) return { ok: false, subscriptionId, error: payload?.error?.message ?? 'Unable to cancel Stripe subscription.' };
  return { ok: true, subscriptionId, status: payload.status };
}

function isAuthUserBlocked(authUser: any) {
  if (!authUser?.banned_until) return false;
  const bannedUntil = new Date(authUser.banned_until).getTime();
  return Number.isFinite(bannedUntil) && bannedUntil > Date.now();
}

function isPaidRevenueInvoice(invoice: any) {
  const status = String(invoice.status ?? '').toLowerCase();
  const paymentStatus = String(invoice.payment_status ?? '').toLowerCase();
  const paidStatuses = ['paid', 'complete', 'completed', 'succeeded'];
  return paidStatuses.includes(status) || paidStatuses.includes(paymentStatus) || Boolean(invoice.paid_at);
}

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getInvoicePaidTimestamp(invoice: any) {
  const timestamp = new Date(invoice.paid_at ?? invoice.issued_at ?? invoice.created_at ?? '').getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatChartDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildRevenueChart(invoices: any[]) {
  const today = getLocalDayStart(new Date());
  const chart = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    return { date: formatChartDate(date), label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), paidInvoices: 0, revenueCents: 0 };
  });
  const rowByDate = new Map(chart.map((row) => [row.date, row]));
  invoices.forEach((invoice) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    if (!timestamp) return;
    const row = rowByDate.get(formatChartDate(new Date(timestamp)));
    if (!row) return;
    row.paidInvoices += 1;
    row.revenueCents += Number(invoice.amount_cents ?? 0);
  });
  return chart;
}

function buildPayerRows(invoices: any[], profileById: Map<any, any>) {
  return invoices.slice(0, 10).map((invoice) => {
    const profile = profileById.get(invoice.user_id);
    return {
      userId: invoice.user_id,
      name: profile?.full_name || profile?.email || `User ${String(invoice.user_id ?? '').slice(0, 8)}`,
      email: profile?.email ?? null,
      amountCents: Number(invoice.amount_cents ?? 0),
      currency: invoice.currency ?? 'usd',
      paidAt: invoice.paid_at ?? invoice.issued_at ?? null,
      label: invoice.label ?? null,
    };
  });
}

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100);
}

function getFallbackRenewalDate() {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
}

function buildReceiptEmailHtml({ amountLabel, renewalLabel, checkoutId }: { amountLabel: string; renewalLabel: string; checkoutId: string }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:32px;color:#172026;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e5e8ef;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#1d4ed8;">Payment confirmed</p>
        <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;">WordPilot Pro is active</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#53616c;">Thank you. Your payment was accepted and your WordPilot Pro subscription is now connected to your WordPilot account.</p>
        <div style="background:#f1f5ff;border-radius:16px;padding:18px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:14px;"><strong>Amount paid:</strong> ${amountLabel}</p>
          <p style="margin:0 0 8px;font-size:14px;"><strong>Plan:</strong> WordPilot Pro monthly</p>
          <p style="margin:0;font-size:14px;"><strong>Next renewal:</strong> ${renewalLabel}</p>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#72808c;">Checkout reference: ${checkoutId}</p>
      </div>
    </div>
  `;
}
