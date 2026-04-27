import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Github, LoaderCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Notice = {
  kind: 'error' | 'success' | 'info';
  message: string;
};

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

function isEmailNotConfirmedError(message: string | null) {
  return Boolean(message && message.toLowerCase().includes('email not confirmed'));
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const { signIn, signUp, resendConfirmation, authMessage, authReady } = useAuth();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [sendingConfirmation, setSendingConfirmation] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(authMessage ? { kind: 'info', message: authMessage } : null);
  const [lastAuthError, setLastAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNotice(authMessage ? { kind: 'info', message: authMessage } : null);
  }, [authMessage, isLogin]);

  function validateForm() {
    if (!isValidEmail(email.trim())) {
      return 'Enter a valid email address.';
    }

    if (password.trim().length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (!isLogin) {
      if (fullName.trim().length < 3) {
        return 'Full name must be at least 3 characters.';
      }

      if (password !== confirmPassword) {
        return 'Password confirmation does not match.';
      }

      if (!agreedToTerms) {
        return 'You need to agree to the Terms and Privacy Policy to create an account.';
      }
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setLastAuthError(null);

    const validationError = validateForm();
    if (validationError) {
      setNotice({ kind: 'error', message: validationError });
      return;
    }

    setSubmitting(true);

    if (isLogin) {
      const result = await signIn(email.trim(), password);
      setSubmitting(false);

      if (result.error) {
        setLastAuthError(result.error);
        setNotice({ kind: 'error', message: result.error });
        return;
      }

      setNotice({ kind: 'success', message: 'Signed in successfully. Redirecting to your dashboard...' });
      navigate('/dashboard');
      return;
    }

    const result = await signUp(email.trim(), password, fullName.trim());
    setSubmitting(false);

    if (result.error) {
      setLastAuthError(result.error);
      setNotice({ kind: 'error', message: result.error });
      return;
    }

    if (result.needsEmailVerification) {
      setNotice({
        kind: 'success',
        message: 'Account created. Check your email and click the confirmation link before signing in.',
      });
      navigate('/login');
      return;
    }

    setNotice({ kind: 'success', message: 'Account created successfully. Redirecting to your dashboard...' });
    navigate('/dashboard');
  }

  async function handleResendConfirmation() {
    setNotice(null);

    if (!isValidEmail(email.trim())) {
      setNotice({ kind: 'error', message: 'Enter the same email address you used during signup, then resend confirmation.' });
      return;
    }

    setSendingConfirmation(true);
    const result = await resendConfirmation(email.trim());
    setSendingConfirmation(false);

    if (result.error) {
      setNotice({ kind: 'error', message: result.error });
      return;
    }

    setNotice({ kind: 'success', message: result.message ?? 'Confirmation email sent.' });
  }

  const submitDisabled = submitting || !authReady || (!isLogin && !agreedToTerms);
  const showResendConfirmation = isLogin && isEmailNotConfirmedError(lastAuthError);

  return (
    <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-tertiary-container rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2rem] sm:rounded-[2.5rem] whisper-shadow overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-on-surface-variant">
              {isLogin ? 'Sign in to continue your dictation journey.' : 'Create your account to save texts, sessions, and progress.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <SocialButton
              icon="https://lh3.googleusercontent.com/aida-public/AB6AXuAvBrBKSz12K2lwfFghaT6PP7LQw3uWMHIKtf3hfBPTCgDSMo-RtrnhYRmqnJuXJQ2KYNo6pyxqoY3hxGbxuySOQqApifAWoNVxH0FRNXrf6pEo2hm1jK9p8RShg82x_7rjSXvwVzpqOK_TLHifEYfzLZ4qFZ-0fc2eYTvKxqNdQzDKUOn8Du8I0zBrQgitVLfzNTVRKMIxmqRvuTYsnAmPm4H5RlSoxdmG-b4QL2oikVvSkVxeRRCXA__k_geaNXmko7I4GAn0kIk"
              label="Google"
            />
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl bg-surface-container-low/40 text-on-surface-variant cursor-not-allowed"
              disabled
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">Coming Soon</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-outline-variant">
            <div className="h-px flex-grow bg-surface-container-high"></div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest">Or with email</span>
            <div className="h-px flex-grow bg-surface-container-high"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Full Name</label>
                  <input
                    className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-surface placeholder:text-outline text-sm"
                    placeholder="Ahmed Hassan"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email Address</label>
                <input
                  className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-surface placeholder:text-outline text-sm"
                  placeholder="student@university.edu"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((value) => !value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />

              {!isLogin && (
                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                  autoComplete="new-password"
                />
              )}
            </div>

            {notice && <NoticeCard notice={notice} />}

            {showResendConfirmation && (
              <button
                type="button"
                onClick={() => void handleResendConfirmation()}
                disabled={sendingConfirmation}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-primary font-semibold hover:underline disabled:opacity-60"
              >
                {sendingConfirmation ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Resend confirmation email
              </button>
            )}

            <div className="flex items-center gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={isLogin ? keepSignedIn : agreedToTerms}
                onChange={(event) =>
                  isLogin ? setKeepSignedIn(event.target.checked) : setAgreedToTerms(event.target.checked)
                }
                className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 bg-surface-container-low"
              />
              <label htmlFor="terms" className="text-xs text-on-surface-variant font-medium">
                {isLogin ? 'Keep me signed in on this device' : 'I agree to the Terms and Privacy Policy'}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {isLogin && (
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                Forgot your password?
              </Link>
            )}
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Link to={isLogin ? '/signup' : '/login'} className="text-primary font-semibold hover:underline ml-1">
                {isLogin ? 'Sign up' : 'Log in'}
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
          placeholder="••••••••"
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

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl bg-surface-container-low/40 text-on-surface-variant cursor-not-allowed"
      disabled
    >
      <img src={icon} alt={label} className="w-5 h-5 opacity-70" referrerPolicy="no-referrer" />
      <span className="text-sm font-medium">{label} Soon</span>
    </button>
  );
}
