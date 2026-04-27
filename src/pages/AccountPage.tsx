import React, { useEffect, useState } from 'react';
import { CreditCard, Eye, EyeOff, FileText, Globe2, LockKeyhole, Mail, Save, ScrollText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import { BillingInvoice, Certificate, SavedText } from '../types';

const LANGUAGE_OPTIONS = ['English', 'German', 'Arabic', 'French', 'Spanish'];
const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type SubscriptionSummary = {
  planName: string;
  status: string;
  billingCycle: string;
  amountLabel: string;
  renewalDate: string | null;
};

export default function AccountPage() {
  const { user, profile, updateProfile, sendPasswordChangeCode, changePasswordWithCode, authMessage } = useAuth();
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

  useEffect(() => {
    setFullName(profile?.full_name ?? user?.user_metadata.full_name ?? '');
    setTargetLanguage(profile?.target_language ?? 'English');
    setCefrLevel(profile?.cefr_level ?? 'B1');
  }, [profile, user]);

  useEffect(() => {
    if (!user || !hasSupabaseEnv()) {
      return;
    }

    async function loadAccountData() {
      const [certificatesResult, invoicesResult, savedTextsResult, subscriptionResult] = await Promise.all([
        supabase.from('certificates').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(4),
        supabase.from('billing_invoices').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(4),
        supabase.from('saved_texts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
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
        setInvoices(
          invoicesResult.data.map((invoice) => ({
            id: invoice.id,
            label: invoice.label,
            amount: `$${(invoice.amount_cents / 100).toFixed(2)}`,
            status: invoice.status === 'paid' ? 'paid' : 'upcoming',
            issuedAt: invoice.issued_at,
          })),
        );
      }

      if (!savedTextsResult.error && savedTextsResult.data) {
        setSavedTexts(
          savedTextsResult.data.map((text, index) => ({
            id: text.id,
            title: text.title,
            level: text.level ?? 'B1',
            category: text.category ?? 'General',
            icon: index % 2 === 0 ? 'book' : 'history',
            body: text.body ?? '',
          })),
        );
      }

      if (!subscriptionResult.error && subscriptionResult.data) {
        setSubscription({
          planName: subscriptionResult.data.plan_name ?? 'Scholar Pro',
          status: subscriptionResult.data.status ?? 'active',
          billingCycle: subscriptionResult.data.billing_cycle ?? 'monthly',
          amountLabel: `$${((subscriptionResult.data.amount_cents ?? 0) / 100).toFixed(2)}`,
          renewalDate: subscriptionResult.data.renewal_date ?? null,
        });
      } else {
        setSubscription(null);
      }
    }

    void loadAccountData();
  }, [user]);

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
    setStatus(error ? error : 'Profile saved successfully.');
  }

  async function handleSendPasswordCode() {
    setPasswordStatus(null);

    if (currentPassword.length < 6) {
      setPasswordStatus('Enter your current password first.');
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
      setPasswordStatus('Enter your current password first.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus('Password confirmation does not match.');
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
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pt-24 sm:pt-28">
      <header className="mb-10 sm:mb-12">
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-on-surface mb-3">Account Settings</h1>
        <p className="text-on-surface-variant max-w-2xl">
          Manage your profile, security, subscription details, and certificates in one place while preserving the same product feel across the app.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8">
        <div className="space-y-8">
          <form onSubmit={handleProfileSubmit} className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Profile</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Personal Preferences</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
                <Globe2 className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Full Name</label>
              <input
                className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email</label>
              <input
                className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm"
                value={user?.email ?? ''}
                readOnly
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Target Language</label>
                <select
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Current CEFR Level</label>
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Security</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Change Password</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
                  Confirm your current password, request an email verification code, then save the new password securely.
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
                label="Current Password"
                visible={showCurrentPassword}
                onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
              />
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Verification Code</label>
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary"
                  placeholder="Enter the code from email"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                label="New Password"
                visible={showNewPassword}
                onToggleVisibility={() => setShowNewPassword((value) => !value)}
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
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
                {sendingPasswordCode ? 'Sending code...' : 'Send Email Code'}
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-surface-container text-on-surface px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-70"
              >
                <ShieldCheck className="w-4 h-4" />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Learning Assets</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Saved Text Library</h2>
              </div>
              <Link to="/library" className="text-primary font-bold text-sm hover:underline">
                Open Library
              </Link>
            </div>

            <div className="space-y-4">
              {savedTexts.slice(0, 3).map((text) => (
                <div key={text.id} className="bg-surface-container-low rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-on-surface">{text.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {text.level} Level • {text.category}
                    </p>
                  </div>
                  <Link to="/library" className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold">
                    Open
                  </Link>
                </div>
              ))}
              {savedTexts.length === 0 && (
                <div className="bg-surface-container-low rounded-2xl p-5 text-sm text-on-surface-variant">
                  Your library is empty right now. Save texts from AI Lab or the workspace and they will appear here.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="bg-primary text-on-primary rounded-[2rem] p-8 whisper-shadow relative overflow-hidden">
            <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary-container mb-3">Subscription</p>
            <h2 className="font-headline font-black text-3xl">{subscription?.planName ?? 'Billing not connected'}</h2>
            <p className="text-on-primary/80 mt-3">
              {subscription
                ? `${subscription.status} ${subscription.billingCycle} plan with account-linked access.`
                : 'No live subscription has been connected yet, so billing details are hidden until the payment flow is implemented.'}
            </p>
            <div className="mt-6 bg-white/10 rounded-2xl p-5 space-y-2">
              <p className="text-xs uppercase tracking-widest font-bold text-primary-container">
                {subscription?.renewalDate ? 'Renewal' : 'Status'}
              </p>
              <p className="font-bold text-lg">
                {subscription?.renewalDate
                  ? new Date(subscription.renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Waiting for live billing'}
              </p>
              <p className="text-sm text-on-primary/80">
                {subscription ? `${subscription.amountLabel} billed ${subscription.billingCycle}` : 'This section will update when subscriptions and payments are live.'}
              </p>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Billing</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Invoices</h2>
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
                      <p className="text-xs text-on-surface-variant mt-1">{new Date(invoice.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
                  No invoices yet. This area will stay empty until a real payment flow is connected and a charge is actually created.
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary mb-2">Certificates</p>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Achievement History</h2>
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
                        {new Date(certificate.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-low rounded-2xl p-4 text-sm text-on-surface-variant">
                  No certificates yet. Complete strong dictation sessions first and your achievements will appear here.
                </div>
              )}
            </div>

            {certificates.length > 0 && (
              <Link to="/certificates" className="inline-flex text-primary font-bold text-sm hover:underline">
                Open certificate history
              </Link>
            )}
          </section>

          <section className="bg-surface-container rounded-[2rem] p-8 space-y-4">
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-primary">Project Status</p>
            <p className="font-semibold text-on-surface">Connected to Supabase</p>
            <p className="text-sm text-on-surface-variant">
              {authMessage ?? 'Auth, profile sync, saved texts, and certificate flows are connected. Billing and certificate data will become fully live after running the updated schema.'}
            </p>
            <Link to="/pricing" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
              <FileText className="w-4 h-4" />
              Review plans
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
