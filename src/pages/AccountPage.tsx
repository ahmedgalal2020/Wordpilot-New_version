import React, { useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Eye, EyeOff, FileText, Globe2, LockKeyhole, Mail, RefreshCw, Save, ScrollText, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { BillingInvoice, Certificate, SavedText } from '../types';
import { formatUsage, isPaidBillingInvoice, PRO_LIMITS, writeCachedEntitlement } from '../lib/entitlements';
import { useEntitlements } from '../hooks/useEntitlements';
import { fetchApi } from '../lib/api';
import { useI18n } from '../i18n';

const LANGUAGE_OPTIONS = ['English', 'German', 'Spanish', 'Italian', 'French'];
const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type SubscriptionSummary = {
  id?: string;
  planName: string;
  status: string;
  billingCycle: string;
  amountLabel: string;
  renewalDate: string | null;
};

type CheckoutSessionSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  clientReferenceId: string | null;
  customerId: string | null;
  customerEmail: string | null;
  amountTotal: number;
  currency: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  trialEnd: number | null;
  priceId: string | null;
  invoiceId: string | null;
  invoiceStatus: string | null;
  invoiceHostedUrl: string | null;
  invoicePdfUrl: string | null;
  paidAt: number | null;
};

export default function AccountPage() {
  const location = useLocation();
  const { session, user, profile, updateProfile, sendPasswordChangeCode, changePasswordWithCode, authMessage } = useAuth();
  const { language: interfaceLanguage, translateLanguageName } = useI18n();
  const copy = accountCopy[interfaceLanguage];
  const [fullName, setFullName] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingPasswordCode, setSendingPasswordCode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [checkoutSyncState, setCheckoutSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [billingEmailNotice, setBillingEmailNotice] = useState<string | null>(null);
  const { entitlements, refreshEntitlements } = useEntitlements(user);
  const subscriptionIsActive = subscription ? isActiveAccountSubscription(subscription) : false;
  const hasPaidInvoice = invoices.some((invoice) => invoice.status === 'paid');
  const accountHasProAccess = subscriptionIsActive || entitlements.isPro || hasPaidInvoice;
  const accountLimits = accountHasProAccess ? PRO_LIMITS : entitlements.limits;
  const activePlanName = accountHasProAccess ? (subscription?.planName ?? 'WordPilot Pro') : 'Essential Free';
  const activePlanStatus = accountHasProAccess ? (subscription?.status ?? 'active') : 'free';

  useEffect(() => {
    setFullName(profile?.full_name ?? user?.user_metadata.full_name ?? '');
    setTargetLanguage(profile?.target_language ?? 'English');
    setCefrLevel(profile?.cefr_level ?? 'B1');
  }, [profile, user]);

  useEffect(() => {
    if (user && accountHasProAccess) {
      writeCachedEntitlement(user.id, true);
    }
  }, [accountHasProAccess, user?.id]);

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      return;
    }

    async function loadAccountData() {
      const [certificatesResult, invoicesResult, savedTextsResult, subscriptionResult] = await Promise.all([
        supabase.from('certificates').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(4),
        supabase.from('billing_invoices').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(4),
        supabase.from('saved_texts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('current_period_end', { ascending: false, nullsFirst: false })
          .order('renewal_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!certificatesResult.error && certificatesResult.data) {
        setCertificates(
          certificatesResult.data.map((certificate) => ({
            id: certificate.id,
            title: certificate.title,
            score: Math.round(certificate.score ?? 0),
            language: certificate.language ?? 'English',
            issuedAt: certificate.issued_at,
            level: certificate.cefr_level ?? 'B1',
            sessionTitle: certificate.title,
          })),
        );
      }

      if (!invoicesResult.error && invoicesResult.data) {
        const hasPaidInvoice = invoicesResult.data.some((invoice) => isPaidBillingInvoice(invoice));
        if (hasPaidInvoice) {
          writeCachedEntitlement(user.id, true);
        }

        setInvoices(
          invoicesResult.data.map((invoice) => ({
            id: invoice.id,
            label: invoice.label,
            amount: `$${(invoice.amount_cents / 100).toFixed(2)}`,
            status: isPaidBillingInvoice(invoice) ? 'paid' : 'upcoming',
            issuedAt: invoice.issued_at,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
            invoicePdfUrl: invoice.invoice_pdf_url ?? null,
          })),
        );
      }

      if (!savedTextsResult.error && savedTextsResult.data) {
        setSavedTexts(
          savedTextsResult.data.map((text, index) => ({
            id: text.id,
            title: text.title,
            level: text.level ?? 'B1',
        category: text.category ?? copy.general,
            icon: index % 2 === 0 ? 'book' : 'history',
            body: text.body ?? '',
          })),
        );
      }

      if (!subscriptionResult.error && subscriptionResult.data) {
        const loadedSubscription = {
          id: subscriptionResult.data.id,
          planName: subscriptionResult.data.plan_name ?? 'WordPilot Pro',
          status: subscriptionResult.data.status ?? 'active',
          billingCycle: subscriptionResult.data.billing_cycle ?? 'monthly',
          amountLabel: `$${((subscriptionResult.data.amount_cents ?? 0) / 100).toFixed(2)}`,
          renewalDate: subscriptionResult.data.renewal_date ?? null,
        };
        if (isActiveAccountSubscription(loadedSubscription)) {
          writeCachedEntitlement(user.id, true);
        }

        setSubscription({
          ...loadedSubscription,
        });
      } else {
        setSubscription(null);
      }
    }

    void loadAccountData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkoutStatus !== 'success' || !sessionId) {
      if (checkoutStatus === 'cancelled') {
        setCheckoutSyncState('error');
      setCheckoutNotice(copy.checkoutCancelled);
      }
      return;
    }

    void syncStripeCheckout(sessionId);
  }, [location.search, user]);

  async function syncStripeCheckout(sessionId: string) {
    if (!user) {
      return;
    }

    setCheckoutSyncState('syncing');
    setCheckoutNotice(copy.confirmingPayment);

    try {
      const response = await fetchApi('/api/billing/sync-checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      const syncPayload = (await response.json()) as {
        checkout?: CheckoutSessionSummary;
        database?: {
          synced?: boolean;
          skipped?: boolean;
          reason?: string;
          subscription?: { id?: string };
          invoice?: { id?: string; hosted_invoice_url?: string | null; invoice_pdf_url?: string | null };
          error?: string;
        };
        error?: string;
      };
      const checkout = syncPayload.checkout;

      if (!response.ok || !checkout) {
        throw new Error(syncPayload.error ?? copy.unableConfirm);
      }

      if (checkout.clientReferenceId && checkout.clientReferenceId !== user.id) {
        throw new Error(copy.checkoutDifferentAccount);
      }

      const paymentConfirmed = checkout.status === 'complete' || checkout.paymentStatus === 'paid';
      if (!paymentConfirmed) {
        setCheckoutSyncState('error');
        setCheckoutNotice(copy.checkoutNotPaid);
        return;
      }

      const amountCents = checkout.amountTotal ?? 1200;
      const renewalDate = checkout.currentPeriodEnd
        ? new Date(checkout.currentPeriodEnd * 1000).toISOString()
        : getFallbackRenewalDate();
      const paidAt = checkout.paidAt ? new Date(checkout.paidAt * 1000).toISOString() : new Date().toISOString();
      const statusLabel = checkout.subscriptionStatus ?? 'active';
      const nextSubscription: SubscriptionSummary = {
        id: syncPayload.database?.subscription?.id ?? subscription?.id,
        planName: 'WordPilot Pro',
        status: statusLabel,
        billingCycle: 'monthly',
        amountLabel: formatCurrency(amountCents, checkout.currency),
        renewalDate,
      };

      if (hasSupabaseEnv()) {
        if (!syncPayload.database?.synced) {
          throw new Error(syncPayload.database?.reason ?? copy.billingSyncMissing);
        }

        const invoiceLabel = `WordPilot Pro checkout ${checkout.id.slice(-8)}`;
        const existingInvoice = await supabase
          .from('billing_invoices')
          .select('id,hosted_invoice_url,invoice_pdf_url,issued_at')
          .eq('user_id', user.id)
          .eq('label', invoiceLabel)
          .maybeSingle();

        if (!existingInvoice.data) {
          setInvoices((current) => [
            {
              id: syncPayload.database?.invoice?.id ?? checkout.id,
              label: invoiceLabel,
              amount: formatCurrency(amountCents, checkout.currency),
              status: checkout.invoiceStatus === 'open' ? 'upcoming' : 'paid',
              issuedAt: paidAt,
              hostedInvoiceUrl: syncPayload.database?.invoice?.hosted_invoice_url ?? checkout.invoiceHostedUrl,
              invoicePdfUrl: syncPayload.database?.invoice?.invoice_pdf_url ?? checkout.invoicePdfUrl,
            },
            ...current.filter((invoice) => invoice.label !== invoiceLabel),
          ]);
        } else {
          setInvoices((current) => {
            if (current.some((invoice) => invoice.label === invoiceLabel)) {
              return current;
            }

            return [
              {
                id: existingInvoice.data.id,
                label: invoiceLabel,
                amount: formatCurrency(amountCents, checkout.currency),
                status: checkout.invoiceStatus === 'open' ? 'upcoming' : 'paid',
                issuedAt: existingInvoice.data.issued_at ?? paidAt,
                hostedInvoiceUrl: existingInvoice.data.hosted_invoice_url ?? checkout.invoiceHostedUrl,
                invoicePdfUrl: existingInvoice.data.invoice_pdf_url ?? checkout.invoicePdfUrl,
              },
              ...current,
            ];
          });
        }
      }

      setSubscription(nextSubscription);
      writeCachedEntitlement(user.id, true);
      void refreshEntitlements();
      setCheckoutSyncState('synced');
      setCheckoutNotice(copy.paymentConfirmed);
      void sendBillingReceiptEmail(sessionId);
      window.history.replaceState({}, document.title, '/account');
    } catch (error) {
      setCheckoutSyncState('error');
      setCheckoutNotice(error instanceof Error ? error.message : copy.unableSync);
    }
  }

  async function sendBillingReceiptEmail(sessionId: string) {
    const sentKey = `wordpilot-receipt-sent-${sessionId}`;
    if (window.sessionStorage.getItem(sentKey)) {
      return;
    }

    try {
      const response = await fetchApi('/api/billing/send-receipt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? copy.receiptNotSent);
      }

      window.sessionStorage.setItem(sentKey, 'true');
      setBillingEmailNotice(
        payload.skipped
          ? copy.receiptWaiting
          : copy.receiptSent,
      );
    } catch (error) {
      setBillingEmailNotice(error instanceof Error ? error.message : copy.receiptNotSent);
    }
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      target_language: targetLanguage,
      cefr_level: cefrLevel,
    });

    setSaving(false);
    setStatus(error ? error : copy.profileSaved);
  }

  async function handleSendPasswordCode() {
    setPasswordStatus(null);

    if (currentPassword.length < 6) {
      setPasswordStatus(copy.currentPasswordFirst);
      return;
    }

    setSendingPasswordCode(true);
    const result = await sendPasswordChangeCode(currentPassword);
    setSendingPasswordCode(false);
    setPasswordStatus(result.error ?? result.message);
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus(null);

    if (currentPassword.length < 6) {
      setPasswordStatus(copy.currentPasswordFirst);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus(copy.passwordLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus(copy.passwordMismatch);
      return;
    }

    setSavingPassword(true);
    const result = await changePasswordWithCode(newPassword, emailCode);
    setSavingPassword(false);
    setPasswordStatus(result.error ?? result.message);

    if (!result.error) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmailCode('');
    }
  }

  return (
    <main className="wp-shell py-10 pt-24 sm:py-12 sm:pt-28">
      <header className="mb-10 sm:mb-12">
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface mb-3">{copy.title}</h1>
        <p className="text-on-surface-variant max-w-2xl">
          {copy.subtitle}
        </p>
      </header>

      {checkoutNotice && (
        <div
          className={`mb-8 rounded-2xl border px-5 py-4 text-sm font-semibold ${
            checkoutSyncState === 'synced'
              ? 'border-primary/20 bg-primary-container/40 text-primary'
              : checkoutSyncState === 'syncing'
                ? 'border-outline-variant/20 bg-surface-container-low text-on-surface'
                : 'border-error/20 bg-error-container/25 text-error'
          }`}
        >
          <div className="flex items-center gap-3">
            {checkoutSyncState === 'syncing' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
            <span>{checkoutNotice}</span>
          </div>
        </div>
      )}
      {billingEmailNotice && (
        <div className="mb-8 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4 text-sm font-semibold text-on-surface">
          {billingEmailNotice}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8">
        <div className="space-y-8">
          <form onSubmit={handleProfileSubmit} className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.profile}</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">{copy.preferences}</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <Globe2 className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.fullName}</label>
              <input
                className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={copy.fullNamePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.email}</label>
              <input
                className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm"
                value={user?.email ?? ''}
                readOnly
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.targetLanguage}</label>
                <select
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {translateLanguageName(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.currentLevel}</label>
                <select
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                  value={cefrLevel}
                  onChange={(event) => setCefrLevel(event.target.value)}
                >
                  {CEFR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {status && <StatusBox message={status} />}

            <button
              type="submit"
              disabled={saving}
              className="primary-gradient text-on-primary px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {saving ? copy.saving : copy.saveChanges}
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.security}</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">{copy.changePassword}</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
                  {copy.changePasswordBody}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <LockKeyhole className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                label={copy.currentPassword}
                visible={showCurrentPassword}
                onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
              />
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.verificationCode}</label>
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                  placeholder={copy.codePlaceholder}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                label={copy.newPassword}
                visible={showNewPassword}
                onToggleVisibility={() => setShowNewPassword((value) => !value)}
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label={copy.confirmPassword}
                visible={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
              />
            </div>

            {passwordStatus && <StatusBox message={passwordStatus} />}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSendPasswordCode()}
                disabled={sendingPasswordCode}
                className="primary-gradient text-on-primary px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 disabled:opacity-70"
              >
                <Mail className="w-4 h-4" />
                {sendingPasswordCode ? copy.sendingCode : copy.sendCode}
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-surface-container text-on-surface px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-70"
              >
                <ShieldCheck className="w-4 h-4" />
                {savingPassword ? copy.updating : copy.updatePassword}
              </button>
            </div>
          </form>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.learningAssets}</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">{copy.savedLibrary}</h2>
              </div>
              <Link to="/library" className="text-primary font-bold text-sm hover:underline">
                {copy.openLibrary}
              </Link>
            </div>

            <div className="space-y-4">
              {savedTexts.slice(0, 3).map((text) => (
                <div key={text.id} className="bg-surface-container-low rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-on-surface">{text.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {copy.textMeta(text.level, text.category)}
                    </p>
                  </div>
                  <Link to="/library" className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold">
                    {copy.open}
                  </Link>
                </div>
              ))}
              {savedTexts.length === 0 && (
                <div className="bg-surface-container-low rounded-2xl p-5 text-sm text-on-surface-variant">
                  {copy.emptyLibrary}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="bg-primary text-on-primary rounded-[2rem] p-8 whisper-shadow relative overflow-hidden">
            <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container mb-3">{copy.subscription}</p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline font-black text-3xl">{activePlanName}</h2>
                <p className="text-on-primary/80 mt-3">
                  {accountHasProAccess
                    ? copy.proConnected
                    : copy.freePlan}
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-container">
                {activePlanStatus}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <SubscriptionMetric label={copy.plan} value={accountHasProAccess ? activePlanName : 'Essential'} />
              <SubscriptionMetric label={copy.billing} value={accountHasProAccess ? (subscription?.billingCycle ?? 'monthly') : copy.none} />
              <SubscriptionMetric label={copy.amount} value={accountHasProAccess ? (subscription?.amountLabel ?? '$12.00') : '$0.00'} />
              <SubscriptionMetric
                label={subscription?.renewalDate ? copy.renews : copy.access}
                value={
                  accountHasProAccess && subscription?.renewalDate
                    ? new Date(subscription.renewalDate).toLocaleDateString(interfaceLanguage === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })
                    : accountHasProAccess
                      ? copy.active
                      : copy.limited
                }
              />
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-xs uppercase tracking-widest font-bold text-primary-container">{copy.planIncludes}</p>
              <ul className="mt-4 space-y-2 text-sm text-on-primary/85">
                {(accountHasProAccess
                  ? copy.proBenefits
                  : copy.freeBenefits
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-container" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 rounded-2xl bg-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-widest font-bold text-primary-container">
                   {accountHasProAccess ? copy.usageThisMonth : copy.usageLimits}
                </p>
                {accountHasProAccess && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-container">
                    {copy.unlimitedPlan}
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-3 text-sm text-on-primary/85">
                <UsageLine
                  label={copy.aiGenerations}
                  value={formatAccountUsage(entitlements.usage.aiGenerationsThisMonth, accountLimits.aiGenerationsMonthly, accountHasProAccess)}
                />
                <UsageLine
                  label={copy.savedTexts}
                  value={formatAccountUsage(entitlements.usage.savedTexts, accountLimits.savedTexts, accountHasProAccess)}
                />
                <UsageLine
                  label={copy.savedSessions}
                  value={formatAccountUsage(entitlements.usage.savedSessions, accountLimits.savedSessions, accountHasProAccess)}
                />
              </div>
              {accountHasProAccess && (
                <p className="mt-4 text-xs font-medium leading-5 text-on-primary/70">
                  {copy.activityOnly}
                </p>
              )}
            </div>
            <Link
              to="/pricing"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-white/25"
            >
              {accountHasProAccess ? copy.reviewPlans : copy.upgradePro}
            </Link>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.billing}</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">{copy.invoices}</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-3">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-surface-container-low rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{invoice.label}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{new Date(invoice.issuedAt).toLocaleDateString(interfaceLanguage === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      {(invoice.hostedInvoiceUrl || invoice.invoicePdfUrl) && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-primary">
                          {invoice.hostedInvoiceUrl && (
                            <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              {copy.viewInvoice}
                            </a>
                          )}
                          {invoice.invoicePdfUrl && (
                            <a href={invoice.invoicePdfUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-on-surface">{invoice.amount}</p>
                      <p className={`text-xs font-bold uppercase ${invoice.status === 'paid' ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-low rounded-2xl p-4 text-sm text-on-surface-variant">
                  {copy.noInvoices}
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">{copy.certificates}</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">{copy.achievementHistory}</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <ScrollText className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-3">
              {certificates.length > 0 ? (
                certificates.map((certificate) => (
                  <div key={certificate.id} className="bg-surface-container-low rounded-2xl p-4">
                    <p className="font-semibold text-on-surface">{certificate.level} {certificate.language} {certificate.sessionTitle}</p>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-primary font-bold">{certificate.score}%</span>
                      <span className="text-on-surface-variant">
                        {new Date(certificate.issuedAt).toLocaleDateString(interfaceLanguage === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-low rounded-2xl p-4 text-sm text-on-surface-variant">
                  {copy.noCertificates}
                </div>
              )}
            </div>

            {certificates.length > 0 && (
              <Link to="/certificates" className="inline-flex text-primary font-bold text-sm hover:underline">
                {copy.openCertificates}
              </Link>
            )}
          </section>

          <section className="bg-surface-container rounded-[2rem] p-8 space-y-4">
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">{copy.accountStatus}</p>
            <p className="font-semibold text-on-surface">{copy.workspaceReady}</p>
            <p className="text-sm text-on-surface-variant">
              {authMessage ?? copy.accountStatusBody}
            </p>
            <Link to="/pricing" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
              <FileText className="w-4 h-4" />
              {copy.viewPlans}
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

function PasswordInput({
  value,
  onChange,
  label,
  visible,
  onToggleVisibility,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 pr-12 text-on-surface text-sm outline-none focus:border-primary"
          placeholder="Password"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function StatusBox({ message }: { message: string }) {
  return <div className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">{message}</div>;
}

function SubscriptionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">{label}</p>
      <p className="mt-2 text-sm font-black text-on-primary">{value}</p>
    </div>
  );
}

function UsageLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-mono font-bold text-primary-container">{value}</span>
    </div>
  );
}

function formatAccountUsage(current: number, limit: number | null, unlimited: boolean) {
  return unlimited ? current.toLocaleString('en-US') : formatUsage(current, limit);
}

function formatCurrency(amountCents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function getFallbackRenewalDate() {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate.toISOString();
}

function isActiveAccountSubscription(subscription: SubscriptionSummary) {
  const planName = subscription.planName.toLowerCase();
  const status = subscription.status.toLowerCase();
  return planName.includes('pro') && ['active', 'trialing', 'paid', 'complete', 'completed', 'succeeded'].includes(status);
}

const accountCopy = {
  en: {
    title: 'Account Settings',
    subtitle: 'Manage your profile, security, subscription details, and certificates in one place.',
    profile: 'Profile',
    preferences: 'Personal Preferences',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    email: 'Email',
    targetLanguage: 'Target Language',
    currentLevel: 'Current CEFR Level',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    security: 'Security',
    changePassword: 'Change Password',
    changePasswordBody: 'Confirm your current password, request an email verification code, then save the new password securely.',
    currentPassword: 'Current Password',
    verificationCode: 'Verification Code',
    codePlaceholder: 'Enter the code from email',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    sendingCode: 'Sending code...',
    sendCode: 'Send Email Code',
    updating: 'Updating...',
    updatePassword: 'Update Password',
    learningAssets: 'Learning Assets',
    savedLibrary: 'Saved Text Library',
    openLibrary: 'Open Library',
    open: 'Open',
    textMeta: (level: string, category: string) => `${level} Level - ${category}`,
    emptyLibrary: 'Your library is empty right now. Save texts from AI Lab or the workspace and they will appear here.',
    subscription: 'Subscription',
    proConnected: 'Your paid plan is connected to this account and ready for Pro workflows.',
    freePlan: 'You are currently on the free plan. Upgrade to unlock the full practice workflow.',
    plan: 'Plan',
    billing: 'Billing',
    amount: 'Amount',
    none: 'none',
    renews: 'Renews',
    access: 'Access',
    active: 'Active',
    limited: 'Limited',
    planIncludes: 'What the user gets',
    proBenefits: ['Unlimited AI Lab generation', 'Saved history and progress tracking', 'English and German dictation workflows'],
    freeBenefits: ['Free workspace access', 'Limited saved texts', 'Upgrade required for full Pro workflow'],
    usageThisMonth: 'Usage this month',
    usageLimits: 'Usage & limits',
    unlimitedPlan: 'Unlimited plan',
    aiGenerations: 'AI generations',
    savedTexts: 'Saved texts',
    savedSessions: 'Saved sessions',
    activityOnly: 'These numbers are activity tracking only. WordPilot Pro does not cap AI Lab generation, saved texts, or saved sessions.',
    reviewPlans: 'Review plan options',
    upgradePro: 'Upgrade to WordPilot Pro',
    invoices: 'Invoices',
    viewInvoice: 'View invoice',
    noInvoices: 'No invoices yet. After a successful Stripe checkout, the first WordPilot Pro invoice appears here automatically.',
    certificates: 'Certificates',
    achievementHistory: 'Achievement History',
    noCertificates: 'No certificates yet. Complete strong dictation sessions first and your achievements will appear here.',
    openCertificates: 'Open certificate history',
    accountStatus: 'Account Status',
    workspaceReady: 'Your workspace is ready',
    accountStatusBody: 'Your profile, saved practice, certificates, and subscription details will stay synced with your account.',
    viewPlans: 'View plans',
    checkoutCancelled: 'Checkout was cancelled. Your current plan was not changed.',
    confirmingPayment: 'Confirming your Stripe payment and updating your subscription...',
    unableConfirm: 'Unable to confirm checkout.',
    checkoutDifferentAccount: 'This checkout session belongs to a different account.',
    checkoutNotPaid: 'Stripe has not marked this checkout as paid yet. Refresh the page in a moment.',
    billingSyncMissing: 'Payment was confirmed, but billing sync is not configured on the server.',
    paymentConfirmed: 'Payment confirmed. WordPilot Pro is now active on this account.',
    unableSync: 'Unable to sync checkout.',
    receiptNotSent: 'Receipt email could not be sent.',
    receiptWaiting: 'Payment is confirmed. Receipt email is waiting for email service configuration.',
    receiptSent: 'Receipt email sent with payment confirmation and renewal date.',
    profileSaved: 'Profile saved successfully.',
    currentPasswordFirst: 'Enter your current password first.',
    passwordLength: 'Password must be at least 8 characters.',
    passwordMismatch: 'Password confirmation does not match.',
    general: 'General',
  },
  de: {
    title: 'Kontoeinstellungen',
    subtitle: 'Verwalte Profil, Sicherheit, Abo-Details und Zertifikate an einem Ort.',
    profile: 'Profil',
    preferences: 'Persönliche Einstellungen',
    fullName: 'Vollständiger Name',
    fullNamePlaceholder: 'Dein vollständiger Name',
    email: 'E-Mail',
    targetLanguage: 'Zielsprache',
    currentLevel: 'Aktuelles GER-Niveau',
    saving: 'Speichern...',
    saveChanges: 'Änderungen speichern',
    security: 'Sicherheit',
    changePassword: 'Passwort ändern',
    changePasswordBody: 'Bestätige dein aktuelles Passwort, fordere einen E-Mail-Code an und speichere dann das neue Passwort sicher.',
    currentPassword: 'Aktuelles Passwort',
    verificationCode: 'Bestätigungscode',
    codePlaceholder: 'Code aus der E-Mail eingeben',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    sendingCode: 'Code wird gesendet...',
    sendCode: 'E-Mail-Code senden',
    updating: 'Aktualisieren...',
    updatePassword: 'Passwort aktualisieren',
    learningAssets: 'Lernmaterial',
    savedLibrary: 'Gespeicherte Texte',
    openLibrary: 'Bibliothek öffnen',
    open: 'Öffnen',
    textMeta: (level: string, category: string) => `${level}-Niveau - ${category}`,
    emptyLibrary: 'Deine Bibliothek ist aktuell leer. Speichere Texte aus dem KI-Lab oder Workspace, dann erscheinen sie hier.',
    subscription: 'Abo',
    proConnected: 'Dein bezahlter Plan ist mit diesem Konto verbunden und bereit für Pro-Workflows.',
    freePlan: 'Du nutzt aktuell den kostenlosen Plan. Upgrade schaltet den vollständigen Übungsflow frei.',
    plan: 'Plan',
    billing: 'Billing',
    amount: 'Betrag',
    none: 'keins',
    renews: 'Verlängert',
    access: 'Zugriff',
    active: 'Aktiv',
    limited: 'Begrenzt',
    planIncludes: 'Was der Plan enthält',
    proBenefits: ['Unbegrenzte KI-Lab-Generierung', 'Gespeicherter Verlauf und Fortschritt', 'Englische und deutsche Diktat-Workflows'],
    freeBenefits: ['Kostenloser Workspace-Zugriff', 'Begrenzte gespeicherte Texte', 'Upgrade für den vollständigen Pro-Workflow erforderlich'],
    usageThisMonth: 'Nutzung diesen Monat',
    usageLimits: 'Nutzung & Limits',
    unlimitedPlan: 'Unbegrenzter Plan',
    aiGenerations: 'KI-Generierungen',
    savedTexts: 'Gespeicherte Texte',
    savedSessions: 'Gespeicherte Sessions',
    activityOnly: 'Diese Zahlen dienen nur der Aktivitätsanzeige. WordPilot Pro begrenzt KI-Lab, gespeicherte Texte oder Sessions nicht.',
    reviewPlans: 'Planoptionen ansehen',
    upgradePro: 'Auf WordPilot Pro upgraden',
    invoices: 'Rechnungen',
    viewInvoice: 'Rechnung ansehen',
    noInvoices: 'Noch keine Rechnungen. Nach erfolgreichem Stripe-Checkout erscheint die erste WordPilot-Pro-Rechnung automatisch hier.',
    certificates: 'Zertifikate',
    achievementHistory: 'Erfolge',
    noCertificates: 'Noch keine Zertifikate. Schließe zuerst starke Diktat-Sessions ab, dann erscheinen deine Erfolge hier.',
    openCertificates: 'Zertifikatsverlauf öffnen',
    accountStatus: 'Kontostatus',
    workspaceReady: 'Dein Workspace ist bereit',
    accountStatusBody: 'Profil, gespeicherte Übungen, Zertifikate und Abo-Details bleiben mit deinem Konto synchronisiert.',
    viewPlans: 'Pläne ansehen',
    checkoutCancelled: 'Checkout wurde abgebrochen. Dein aktueller Plan wurde nicht geändert.',
    confirmingPayment: 'Stripe-Zahlung wird bestätigt und dein Abo aktualisiert...',
    unableConfirm: 'Checkout konnte nicht bestätigt werden.',
    checkoutDifferentAccount: 'Diese Checkout-Session gehört zu einem anderen Konto.',
    checkoutNotPaid: 'Stripe hat diesen Checkout noch nicht als bezahlt markiert. Aktualisiere die Seite gleich erneut.',
    billingSyncMissing: 'Zahlung wurde bestätigt, aber Billing-Sync ist serverseitig nicht konfiguriert.',
    paymentConfirmed: 'Zahlung bestätigt. WordPilot Pro ist jetzt für dieses Konto aktiv.',
    unableSync: 'Checkout konnte nicht synchronisiert werden.',
    receiptNotSent: 'Beleg-E-Mail konnte nicht gesendet werden.',
    receiptWaiting: 'Zahlung ist bestätigt. Die Beleg-E-Mail wartet auf die E-Mail-Service-Konfiguration.',
    receiptSent: 'Beleg-E-Mail mit Zahlungsbestätigung und Verlängerungsdatum wurde gesendet.',
    profileSaved: 'Profil erfolgreich gespeichert.',
    currentPasswordFirst: 'Gib zuerst dein aktuelles Passwort ein.',
    passwordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    passwordMismatch: 'Die Passwortbestätigung stimmt nicht überein.',
    general: 'Allgemein',
  },
};



