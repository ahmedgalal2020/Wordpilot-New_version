import React from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Notice = {
  kind: 'error' | 'success' | 'info';
  message: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, changePassword, authReady, authMessage } = useAuth();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [recoveryReady, setRecoveryReady] = React.useState(false);
  const [preparingRecovery, setPreparingRecovery] = React.useState(true);
  const [notice, setNotice] = React.useState<Notice | null>(authMessage ? { kind: 'info', message: authMessage } : null);

  React.useEffect(() => {
    if (!authReady) {
      setPreparingRecovery(false);
      return;
    }

    let active = true;

    async function prepareRecoverySession() {
      try {
        const recoveryFlag = window.sessionStorage.getItem('wordpilot-recovery-flow') === 'ready';
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const recoveryType = hashParams.get('type');
        const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
        const queryType = new URLSearchParams(window.location.search).get('type');

        if (accessToken && refreshToken && recoveryType === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
          if (!active) return;
          setRecoveryReady(true);
          setNotice(null);
          return;
        }

        if (tokenHash && queryType === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            throw error;
          }

          if (!active) return;
          setRecoveryReady(true);
          setNotice(null);
          return;
        }

        if (session && recoveryFlag) {
          setRecoveryReady(true);
          setNotice(null);
          return;
        }

        setRecoveryReady(false);
        setNotice({
          kind: 'info',
          message: 'Open this page from the reset link in your email so we can securely verify your request.',
        });
      } catch (error) {
        console.error('Failed to prepare recovery session', error);
        if (!active) return;
        setRecoveryReady(false);
        setNotice({
          kind: 'error',
          message: 'This password reset link is invalid or expired. Request a fresh reset email and try again.',
        });
      } finally {
        if (active) {
          setPreparingRecovery(false);
        }
      }
    }

    void prepareRecoverySession();

    return () => {
      active = false;
    };
  }, [authReady, session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!recoveryReady) {
      setNotice({
        kind: 'error',
        message: 'This reset session is missing or expired. Request a new password reset email and try again.',
      });
      return;
    }

    if (password.trim().length < 6) {
      setNotice({ kind: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({ kind: 'error', message: 'Password confirmation does not match.' });
      return;
    }

    setSubmitting(true);
    const result = await changePassword(password);
    setSubmitting(false);

    if (result.error) {
      setNotice({ kind: 'error', message: result.error });
      return;
    }

    window.sessionStorage.removeItem('wordpilot-recovery-flow');
    setNotice({ kind: 'success', message: result.message ?? 'Password updated successfully.' });
    window.setTimeout(() => navigate('/login', { replace: true }), 1200);
  }

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-tertiary-container rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2.5rem] whisper-shadow overflow-hidden p-10 flex flex-col gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Create a new password</h1>
            <p className="text-on-surface-variant">
              Set a new password for your account after confirming ownership from your email link.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <PasswordField
              label="New Password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisibility={() => setShowPassword((value) => !value)}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
              autoComplete="new-password"
            />

            {notice && <NoticeCard notice={notice} />}

            <button
              type="submit"
              disabled={submitting || !authReady || !recoveryReady || preparingRecovery}
              className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {(submitting || preparingRecovery) && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {preparingRecovery ? 'Preparing reset link...' : 'Save new password'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-on-surface-variant">
              Back to
              <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
                log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{label}</label>
      <div className="relative">
        <input
          className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-surface placeholder:text-outline text-sm"
          placeholder="Password"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
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

function NoticeCard({ notice }: { notice: Notice }) {
  const styles =
    notice.kind === 'error'
      ? 'bg-error/10 text-error border-error/20'
      : notice.kind === 'success'
        ? 'bg-primary/10 text-on-surface border-primary/20'
        : 'bg-surface-container-low text-on-surface border-surface-container';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${styles}`}>
      {notice.kind === 'error' ? (
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <span>{notice.message}</span>
    </div>
  );
}
