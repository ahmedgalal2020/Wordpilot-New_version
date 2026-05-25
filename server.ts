import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'preview';
const app = express();
const port = Number(process.env.PORT ?? 3000);

type AuthenticatedUser = {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(rejectUntrustedOrigin);
const standardLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const sensitiveLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
const aiLimiter = createRateLimiter({ windowMs: 60_000, max: 8 });
app.use('/api', standardLimiter);
app.use('/api/admin', sensitiveLimiter);
app.use('/api/billing', sensitiveLimiter);
app.use('/api/stripe', sensitiveLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '64kb' }));

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) {
    return res.status(userContext.status).json({ error: userContext.error });
  }

  if (isUserBlocked(userContext.user)) {
    return res.status(403).json({ error: 'This account is blocked.' });
  }

  const userId = userContext.user.id;
  const email = userContext.user.email;
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

  sessionParams.set('client_reference_id', userId);
  sessionParams.set('metadata[user_id]', userId);

  if (email) {
    sessionParams.set('customer_email', email);
  }

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
    const message = payload?.error?.message ?? 'Unable to create Stripe Checkout session.';
    return res.status(stripeResponse.status).json({ error: message });
  }

  return res.json({ url: payload.url });
});

app.get('/api/stripe/checkout-session', async (req, res) => {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) {
    return res.status(userContext.status).json({ error: userContext.error });
  }

  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'A valid checkout session id is required.' });
  }

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription&expand[]=invoice`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );
  const payload = await stripeResponse.json();

  if (!stripeResponse.ok) {
    const message = payload?.error?.message ?? 'Unable to retrieve Stripe Checkout session.';
    return res.status(stripeResponse.status).json({ error: message });
  }

  const subscription = typeof payload.subscription === 'object' ? payload.subscription : null;
  const invoice = typeof payload.invoice === 'object' ? payload.invoice : null;
  const checkoutSummary = buildCheckoutSummary(payload, subscription, invoice);

  if (checkoutSummary.clientReferenceId !== userContext.user.id) {
    return res.status(403).json({ error: 'This checkout session belongs to a different account.' });
  }

  return res.json(checkoutSummary);
});

app.post('/api/billing/sync-checkout', async (req, res) => {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) {
    return res.status(userContext.status).json({ error: userContext.error });
  }

  if (isUserBlocked(userContext.user)) {
    return res.status(403).json({ error: 'This account is blocked.' });
  }

  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId?.startsWith('cs_')) {
    return res.status(400).json({ error: 'A valid checkout session id is required.' });
  }

  const checkout = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
  if (!checkout.ok) {
    return res.status(checkout.status).json({ error: checkout.error });
  }

  const payload = checkout.payload;
  const subscription = typeof payload.subscription === 'object' ? payload.subscription : null;
  const invoice = typeof payload.invoice === 'object' ? payload.invoice : null;
  const summary = buildCheckoutSummary(payload, subscription, invoice);
  const paid = summary.status === 'complete' || summary.paymentStatus === 'paid';

  const userId = userContext.user.id;
  if (summary.clientReferenceId !== userId) {
    return res.status(403).json({ error: 'This checkout session belongs to a different account.' });
  }

  if (!paid) {
    return res.status(409).json({ error: 'Stripe has not marked this checkout as paid yet.', checkout: summary });
  }

  const supabaseResult = await syncCheckoutToSupabase(userId, summary);
  return res.json({ checkout: summary, database: supabaseResult });
});

app.post('/api/billing/send-receipt', async (req, res) => {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) {
    return res.status(userContext.status).json({ error: userContext.error });
  }

  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId?.startsWith('cs_')) {
    return res.status(400).json({ error: 'A valid checkout session id is required.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return res.json({ sent: false, skipped: true, reason: 'RESEND_API_KEY is not configured.' });
  }

  const checkout = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
  if (!checkout.ok) {
    return res.status(checkout.status).json({ error: checkout.error });
  }

  const payload = checkout.payload;
  const subscription = typeof payload.subscription === 'object' ? payload.subscription : null;
  const summary = buildCheckoutSummary(payload, subscription, typeof payload.invoice === 'object' ? payload.invoice : null);
  const paid = payload.status === 'complete' || payload.payment_status === 'paid';
  const recipient = payload.customer_details?.email ?? payload.customer_email;

  if (summary.clientReferenceId !== userContext.user.id) {
    return res.status(403).json({ error: 'This checkout session belongs to a different account.' });
  }

  if (!paid) {
    return res.status(409).json({ error: 'Checkout is not paid yet.' });
  }

  if (!recipient) {
    return res.status(400).json({ error: 'Stripe checkout session has no customer email.' });
  }

  const amountLabel = formatCurrency(payload.amount_total ?? 1200, payload.currency ?? 'usd');
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : getFallbackRenewalDate();
  const renewalLabel = renewalDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.BILLING_EMAIL_FROM?.trim() || 'WordPilot <onboarding@resend.dev>',
      to: recipient,
      subject: 'Your WordPilot Pro payment was confirmed',
      html: buildReceiptEmailHtml({
        amountLabel,
        renewalLabel,
        checkoutId: payload.id,
      }),
    }),
  });
  const emailPayload = await emailResponse.json();

  if (!emailResponse.ok) {
    const message = emailPayload?.message ?? 'Unable to send billing receipt email.';
    return res.status(emailResponse.status).json({ error: message });
  }

  return res.json({ sent: true, id: emailPayload.id });
});

app.post('/api/ai/generate', async (req, res) => {
  const geminiApiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  if (!geminiApiKey) {
    return res.status(503).json({ error: 'Cloud AI generation is not configured.' });
  }

  const userContext = await getAuthenticatedUserContext(req);
  if (!userContext.ok) {
    return res.status(userContext.status).json({ error: userContext.error });
  }

  if (isUserBlocked(userContext.user)) {
    return res.status(403).json({ error: 'This account is blocked.' });
  }

  const prompt = String((req.body as { prompt?: string }).prompt ?? '').trim();
  if (prompt.length < 20 || prompt.length > 8_000) {
    return res.status(400).json({ error: 'Prompt length must be between 20 and 8000 characters.' });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Unable to generate text.';
    return res.status(response.status).json({ error: message });
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  return res.json({ text: text ?? '' });
});

app.get('/api/admin/access', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  return res.json({
    isAdmin: true,
    admin: {
      email: adminContext.admin.email,
      role: adminContext.admin.role,
    },
  });
});

app.get('/api/admin/overview', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const userSearch = typeof req.query.userSearch === 'string' ? req.query.userSearch.trim() : '';
  const usersQuery = buildAdminUsersQuery(userSearch);

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Admin dashboard requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.' });
  }

  const adminCheck = await authenticateAdmin(req, supabaseUrl, serviceRoleKey);
  if (!adminCheck.ok) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

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
    supabaseRest(supabaseUrl, serviceRoleKey, 'profiles', {
      method: 'GET',
      query: usersQuery,
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
      method: 'GET',
      query:
        'select=id,user_id,label,amount_cents,currency,status,payment_status,issued_at,paid_at,hosted_invoice_url,invoice_pdf_url&order=issued_at.desc&limit=10',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
      method: 'GET',
      query: 'select=amount_cents,currency,status,payment_status,issued_at,paid_at&limit=1000',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'dictation_sessions', {
      method: 'GET',
      query: 'select=id,user_id,title,language,accuracy,created_at&order=created_at.desc&limit=10',
    }),
    supabaseRest(supabaseUrl, serviceRoleKey, 'profiles', {
      method: 'GET',
      query: 'select=id,email,full_name&limit=1000',
    }),
    fetchAuthAdminUsers(supabaseUrl, serviceRoleKey),
  ]);

  const firstError = [
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
  ].find((result) => !result.ok);

  if (firstError && !firstError.ok) {
    return res.status(firstError.status ?? 500).json({ error: firstError.error });
  }

  const invoicesForRevenue = Array.isArray(invoiceRevenue.data) ? invoiceRevenue.data : [];
  const activeSubscriberIds = new Set(
    (Array.isArray(activeSubscriptionsRows.data) ? activeSubscriptionsRows.data : [])
      .map((subscription: any) => subscription.user_id)
      .filter(Boolean),
  );
  const paidRevenueInvoices = invoicesForRevenue.filter(isPaidRevenueInvoice);
  const profileById = new Map(
    (Array.isArray(billingProfiles.data) ? billingProfiles.data : []).map((profile: any) => [profile.id, profile]),
  );
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const dayStart = getLocalDayStart(new Date());
  const todayStart = dayStart.getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const revenueCents = paidRevenueInvoices.reduce((sum, invoice) => sum + Number(invoice.amount_cents ?? 0), 0);
  const revenueLast30DaysCents = paidRevenueInvoices
    .filter((invoice) => {
      const timestamp = new Date(invoice.paid_at ?? invoice.issued_at ?? '').getTime();
      return Number.isFinite(timestamp) && timestamp >= thirtyDaysAgo;
    })
    .reduce((sum, invoice) => sum + Number(invoice.amount_cents ?? 0), 0);
  const paidToday = paidRevenueInvoices.filter((invoice) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    return timestamp >= todayStart && timestamp < tomorrowStart;
  });
  const paidYesterday = paidRevenueInvoices.filter((invoice) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    return timestamp >= yesterdayStart && timestamp < todayStart;
  });
  const revenueChart = buildRevenueChart(paidRevenueInvoices);
  const recentPayers = {
    today: buildPayerRows(paidToday, profileById),
    yesterday: buildPayerRows(paidYesterday, profileById),
  };
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

  return res.json({
    generatedAt: new Date().toISOString(),
    admin: {
      email: adminCheck.email,
      role: adminCheck.role,
    },
    metrics: {
      users: usersCount.count,
      subscriptions: subscriptionsCount.count,
      activeSubscriptions: activeSubscriberIds.size,
      paidInvoices: paidInvoicesCount.count,
      revenueCents,
      revenueLast30DaysCents,
      sessions: sessionsCount.count,
      savedTexts: savedTextsCount.count,
      certificates: certificatesCount.count,
    },
    billingSummary: {
      today: {
        paidInvoices: paidToday.length,
        revenueCents: paidToday.reduce((sum, invoice) => sum + Number(invoice.amount_cents ?? 0), 0),
      },
      yesterday: {
        paidInvoices: paidYesterday.length,
        revenueCents: paidYesterday.reduce((sum, invoice) => sum + Number(invoice.amount_cents ?? 0), 0),
      },
      last30Days: revenueChart,
      recentPayers,
    },
    userSearch,
    recentUsers: recentProfiles,
    recentInvoices: recentInvoices.data ?? [],
    recentSessions: recentSessions.data ?? [],
    adminUsers,
  });
});

app.post('/api/admin/admin-users', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  const email = String((req.body as { email?: string }).email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid user email is required.' });
  }

  const profileResult = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'profiles', {
    method: 'GET',
    query: `select=id,email,full_name&email=eq.${encodeURIComponent(email)}&limit=1`,
  });

  if (!profileResult.ok) {
    return res.status(profileResult.status).json({ error: profileResult.error });
  }

  const profile = profileResult.data?.[0];
  if (!profile?.id) {
    return res.status(404).json({ error: 'No registered user was found with this email.' });
  }

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

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ adminUser: result.user ?? null });
});

app.post('/api/admin/admin-users/:userId/revoke', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  const targetUserId = req.params.userId;
  if (targetUserId === adminContext.admin.id) {
    return res.status(400).json({ error: 'You cannot revoke your own admin access.' });
  }

  const authUsers = await fetchAuthAdminUsers(adminContext.supabaseUrl, adminContext.serviceRoleKey);
  if (!authUsers.ok) {
    return res.status(authUsers.status).json({ error: authUsers.error });
  }

  const activeAdmins = (authUsers.users ?? []).filter((authUser: any) => authUser.app_metadata?.role === 'admin' && authUser.app_metadata?.admin_status !== 'revoked');
  if (activeAdmins.length <= 1) {
    return res.status(400).json({ error: 'At least one active admin must remain.' });
  }

  const result = await updateAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId, {
    app_metadata: {
      role: 'user',
      admin_status: 'revoked',
      admin_revoked_by: adminContext.admin.id,
      admin_revoked_at: new Date().toISOString(),
    },
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ adminUser: result.user ?? null });
});

app.post('/api/admin/users/:userId/block', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  const targetUserId = req.params.userId;
  if (targetUserId === adminContext.admin.id) {
    return res.status(400).json({ error: 'You cannot block your own admin account.' });
  }

  const { blocked, reason } = req.body as { blocked?: boolean; reason?: string };
  const shouldBlock = blocked !== false;
  const result = await updateAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId, {
    ban_duration: shouldBlock ? '876000h' : 'none',
    user_metadata: {
      blocked_reason: shouldBlock ? String(reason ?? '').trim() || 'Blocked by admin' : null,
      blocked_by: shouldBlock ? adminContext.admin.id : null,
      blocked_at: shouldBlock ? new Date().toISOString() : null,
    },
    app_metadata: {
      blocked: shouldBlock,
      blocked_reason: shouldBlock ? String(reason ?? '').trim() || 'Blocked by admin' : null,
    },
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'profiles', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(targetUserId)}`,
    body: {
      is_blocked: shouldBlock,
      blocked_reason: shouldBlock ? String(reason ?? '').trim() || 'Blocked by admin' : null,
      blocked_at: shouldBlock ? new Date().toISOString() : null,
      blocked_by: shouldBlock ? adminContext.admin.id : null,
      updated_at: new Date().toISOString(),
    },
    headers: {
      Prefer: 'return=representation',
    },
  });

  return res.json({ user: result.user ?? null });
});

app.post('/api/admin/users/:userId/cancel-subscription', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  const targetUserId = req.params.userId;
  const activeStatuses = 'active,trialing,paid,complete,completed,succeeded';
  const subscriptionsResult = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'user_subscriptions', {
    method: 'GET',
    query: `select=id,stripe_subscription_id,status&user_id=eq.${encodeURIComponent(targetUserId)}&status=in.(${activeStatuses})`,
  });

  if (!subscriptionsResult.ok) {
    return res.status(subscriptionsResult.status).json({ error: subscriptionsResult.error });
  }

  const subscriptions = Array.isArray(subscriptionsResult.data) ? subscriptionsResult.data : [];
  const stripeSecretKey = getStripeSecretKey();
  const stripeResults = [];

  for (const subscription of subscriptions) {
    if (stripeSecretKey && subscription.stripe_subscription_id) {
      stripeResults.push(await cancelStripeSubscription(subscription.stripe_subscription_id, stripeSecretKey));
    }
  }

  const updated = await supabaseRest(adminContext.supabaseUrl, adminContext.serviceRoleKey, 'user_subscriptions', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(targetUserId)}&status=in.(${activeStatuses})`,
    body: {
      status: 'canceled',
      payment_status: 'canceled',
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    headers: {
      Prefer: 'return=representation',
    },
  });

  if (!updated.ok) {
    return res.status(updated.status).json({ error: updated.error });
  }

  return res.json({
    canceledSubscriptions: updated.data ?? [],
    stripeResults,
  });
});

app.post('/api/admin/users/:userId/reset-password', async (req, res) => {
  const adminContext = await getAdminRequestContext(req, res);
  if (!adminContext) return;

  const targetUserId = req.params.userId;
  const authUser = await fetchAuthUser(adminContext.supabaseUrl, adminContext.serviceRoleKey, targetUserId);

  if (!authUser.ok) {
    return res.status(authUser.status).json({ error: authUser.error });
  }

  const email = authUser.user?.email;
  if (!email) {
    return res.status(400).json({ error: 'This user does not have an email address for password reset.' });
  }

  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    return res.status(500).json({ error: 'SUPABASE_ANON_KEY is required to send password reset emails.' });
  }

  const redirectTo = `${getRequestOrigin(req)}/reset-password`;
  const response = await fetch(`${adminContext.supabaseUrl.replace(/\/$/, '')}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      redirect_to: redirectTo,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return res.status(response.status).json({
      error: payload?.msg ?? payload?.message ?? payload?.error ?? 'Unable to send password reset email.',
    });
  }

  return res.json({ sent: true, email });
});

app.post('/api/stripe/webhook', (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: 'Stripe webhook secret is not configured yet.' });
  }

  return res.status(501).json({ error: 'Stripe webhook handling still needs event verification and fulfillment logic.' });
});

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`WordPilot running at http://localhost:${port}`);
});

function securityHeaders(_req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy());
  next();
}

function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.resend.com",
    "media-src 'self' blob:",
  ];

  if (!isProduction) {
    directives.push("connect-src 'self' ws: http: https:");
  }

  return directives.join('; ');
}

function rejectUntrustedOrigin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }

  if (!getAllowedOrigins(req).includes(origin)) {
    res.status(403).json({ error: 'Request origin is not allowed.' });
    return;
  }

  next();
}

function getAllowedOrigins(req: express.Request) {
  const configured = [
    process.env.APP_URL,
    process.env.PUBLIC_APP_URL,
    process.env.SITE_URL,
    ...(process.env.ALLOWED_ORIGINS ?? '').split(','),
  ]
    .map((value) => value?.trim().replace(/\/$/, ''))
    .filter(Boolean) as string[];

  const requestOrigin = getRequestOrigin(req);
  return Array.from(new Set([...configured, requestOrigin]));
}

function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = `${req.ip}:${getBearerToken(req) ?? 'anonymous'}:${req.path}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000).toString());
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    next();
  };
}

function getRequestOrigin(req: express.Request) {
  const configuredOrigin = process.env.APP_URL?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, '');
  }

  const protocol = req.headers['x-forwarded-proto']?.toString() ?? req.protocol;
  const host = req.headers['x-forwarded-host']?.toString() ?? req.headers.host;
  return `${protocol}://${host}`;
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim();
}

function getSupabaseServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  return { supabaseUrl, anonKey };
}

async function getAuthenticatedUserContext(req: express.Request) {
  const { supabaseUrl, anonKey } = getSupabaseServerConfig();
  if (!supabaseUrl || !anonKey) {
    return { ok: false as const, status: 500, error: 'Supabase auth is not configured.' };
  }

  const token = getBearerToken(req);
  if (!token) {
    return { ok: false as const, status: 401, error: 'Authentication is required.' };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json().catch(() => null);

  if (!response.ok || !user?.id) {
    return { ok: false as const, status: 401, error: 'Session could not be verified.' };
  }

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

function isUserBlocked(user: AuthenticatedUser) {
  return user.app_metadata?.blocked === true;
}

async function getAdminRequestContext(req: express.Request, res: express.Response) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Admin actions require SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.' });
    return null;
  }

  const admin = await authenticateAdmin(req, supabaseUrl, serviceRoleKey);
  if (!admin.ok) {
    res.status(admin.status).json({ error: admin.error });
    return null;
  }

  return { supabaseUrl, serviceRoleKey, admin };
}

async function authenticateAdmin(req: express.Request, supabaseUrl: string, serviceRoleKey: string) {
  const adminEmails = getConfiguredAdminEmails();
  const adminUserIds = getConfiguredAdminUserIds();

  const token = getBearerToken(req);
  if (!token) {
    return { ok: false as const, status: 401, error: 'Admin authentication is required.' };
  }

  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    return { ok: false as const, status: 500, error: 'SUPABASE_ANON_KEY is required to verify admin sessions.' };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json();

  if (!response.ok) {
    return { ok: false as const, status: 401, error: 'Admin session could not be verified.' };
  }

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

  const emailAllowed = email && adminEmails.includes(email);
  const idAllowed = id && adminUserIds.includes(id);

  if (!emailAllowed && !idAllowed) {
    return { ok: false as const, status: 403, error: 'This account is not allowed to view the admin dashboard.' };
  }

  return { ok: true as const, email, id, role: 'bootstrap' };
}

function getBearerToken(req: express.Request) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getConfiguredAdminUserIds() {
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function buildAdminUsersQuery(userSearch: string) {
  const baseSelect = 'select=id,email,full_name,target_language,cefr_level,created_at,updated_at';
  const baseQuery = `${baseSelect}&order=created_at.desc&limit=25`;

  if (!userSearch) {
    return baseQuery;
  }

  const escapedSearch = userSearch.replace(/[%*,()]/g, ' ').trim();
  if (!escapedSearch) {
    return baseQuery;
  }

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

async function syncCheckoutToSupabase(userId: string, checkout: ReturnType<typeof buildCheckoutSummary>) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      synced: false,
      skipped: true,
      reason: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Client fallback will be used.',
    };
  }

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
    metadata: {
      checkout_status: checkout.status,
      customer_email: checkout.customerEmail,
    },
    updated_at: new Date().toISOString(),
  };

  const subscriptionResponse = await supabaseRest(supabaseUrl, serviceRoleKey, 'user_subscriptions', {
    method: 'POST',
    query: 'on_conflict=stripe_checkout_session_id',
    body: subscriptionPayload,
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  });

  if (!subscriptionResponse.ok) {
    return {
      synced: false,
      skipped: false,
      error: subscriptionResponse.error,
    };
  }

  const subscriptionRow = subscriptionResponse.data?.[0] ?? null;
  const invoicePayload = {
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
    metadata: {
      checkout_status: checkout.status,
      customer_email: checkout.customerEmail,
    },
    updated_at: new Date().toISOString(),
  };

  const invoiceResponse = await supabaseRest(supabaseUrl, serviceRoleKey, 'billing_invoices', {
    method: 'POST',
    query: 'on_conflict=stripe_checkout_session_id',
    body: invoicePayload,
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  });

  if (!invoiceResponse.ok) {
    return {
      synced: false,
      skipped: false,
      subscription: subscriptionRow,
      error: invoiceResponse.error,
    };
  }

  return {
    synced: true,
    skipped: false,
    subscription: subscriptionRow,
    invoice: invoiceResponse.data?.[0] ?? null,
  };
}

async function supabaseRest(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  options: {
    method: string;
    query?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  },
) {
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}${options.query ? `?${options.query}` : ''}`;
  const response = await fetch(url, {
    method: options.method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.message ?? data?.error ?? text,
    };
  }

  return { ok: true, status: response.status, data };
}

async function supabaseCount(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  query = '',
) {
  const countQuery = `select=id&limit=0${query ? `&${query}` : ''}`;
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?${countQuery}`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'count=exact',
    },
  });
  const text = await response.text();

  if (!response.ok) {
    const data = text ? JSON.parse(text) : null;
    return {
      ok: false as const,
      status: response.status,
      error: data?.message ?? data?.error ?? text,
      count: 0,
    };
  }

  const contentRange = response.headers.get('content-range') ?? '';
  const count = Number(contentRange.split('/')[1] ?? 0);
  return { ok: true as const, status: response.status, count: Number.isFinite(count) ? count : 0 };
}

async function fetchAuthAdminUsers(supabaseUrl: string, serviceRoleKey: string) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to load Supabase Auth users.',
      users: [],
    };
  }

  return { ok: true as const, status: response.status, users: data.users ?? [] };
}

async function updateAuthUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  payload: Record<string, unknown>,
) {
  const currentUser = await fetchAuthUser(supabaseUrl, serviceRoleKey, userId);
  const nextPayload = { ...payload };

  if (currentUser.ok && payload.app_metadata && typeof payload.app_metadata === 'object') {
    nextPayload.app_metadata = {
      ...(currentUser.user?.app_metadata ?? {}),
      ...(payload.app_metadata as Record<string, unknown>),
    };
  }

  if (currentUser.ok && payload.user_metadata && typeof payload.user_metadata === 'object') {
    nextPayload.user_metadata = {
      ...(currentUser.user?.user_metadata ?? {}),
      ...(payload.user_metadata as Record<string, unknown>),
    };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(nextPayload),
  });
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to update Supabase Auth user.',
      user: null,
    };
  }

  return { ok: true as const, status: response.status, user: data };
}

async function fetchAuthUser(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: data?.msg ?? data?.message ?? data?.error ?? 'Unable to load Supabase Auth user.',
      user: null,
    };
  }

  return { ok: true as const, status: response.status, user: data };
}

function isAuthUserBlocked(authUser: any) {
  if (!authUser?.banned_until) {
    return false;
  }

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
    return {
      date: formatChartDate(date),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      paidInvoices: 0,
      revenueCents: 0,
    };
  });
  const rowByDate = new Map(chart.map((row) => [row.date, row]));

  invoices.forEach((invoice) => {
    const timestamp = getInvoicePaidTimestamp(invoice);
    if (!timestamp) return;

    const date = formatChartDate(new Date(timestamp));
    const row = rowByDate.get(date);
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

async function fetchStripeCheckoutSession(sessionId: string, stripeSecretKey: string) {
  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription&expand[]=invoice`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );
  const payload = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return {
      ok: false as const,
      status: stripeResponse.status,
      error: payload?.error?.message ?? 'Unable to retrieve Stripe Checkout session.',
    };
  }

  return { ok: true as const, payload };
}

async function cancelStripeSubscription(subscriptionId: string, stripeSecretKey: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      subscriptionId,
      error: payload?.error?.message ?? 'Unable to cancel Stripe subscription.',
    };
  }

  return {
    ok: true,
    subscriptionId,
    status: payload.status,
  };
}

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function getFallbackRenewalDate() {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
}

function buildReceiptEmailHtml({
  amountLabel,
  renewalLabel,
  checkoutId,
}: {
  amountLabel: string;
  renewalLabel: string;
  checkoutId: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:32px;color:#172026;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e5e8ef;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#1d4ed8;">Payment confirmed</p>
        <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;">WordPilot Pro is active</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#53616c;">
          Thank you. Your payment was accepted and your WordPilot Pro subscription is now connected to your WordPilot account.
        </p>
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
