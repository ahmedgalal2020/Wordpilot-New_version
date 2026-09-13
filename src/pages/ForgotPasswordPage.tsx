import React from 'react';
import { CheckCircle2, LoaderCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { AuthCaptcha, authCaptchaRequired } from '../components/AuthCaptcha';
import { authSecurityCopy, isAuthRateLimited, type AuthFailure } from '../lib/authProtection';
import { withAuthDeadline } from '../lib/oauthRecovery';
import { useDeadlineCountdown } from '../hooks/useDeadlineCountdown';

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function ForgotPasswordPage() {
  const { resetPassword, authReady, authMessage } = useAuth();
  const { language } = useI18n();
  const copy = forgotPasswordCopy[language];
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(authMessage);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const busy = React.useRef(false);
  const generation = React.useRef(0);
  const [captchaToken, setCaptchaToken] = React.useState<string | undefined>();
  const [captchaVersion, setCaptchaVersion] = React.useState(0);
  const [retryAt, setRetryAt] = React.useState(0);
  const remaining = useDeadlineCountdown(retryAt);
  const securityCopy = authSecurityCopy[language];

  React.useEffect(() => () => { generation.current += 1; }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || Date.now() < retryAt || !authReady) return;
    setMessage(null);
    setIsSuccess(false);

    if (!isValidEmail(email.trim())) {
      setMessage(copy.invalidEmail);
      return;
    }

    if (authCaptchaRequired && !captchaToken) { setMessage(securityCopy.captcha); return; }
    busy.current = true;
    const requestId = ++generation.current;
    setSubmitting(true);
    try {
      const result = await withAuthDeadline<AuthFailure>(resetPassword(email.trim(), captchaToken), 20000);
      if (requestId !== generation.current) return;
      setRetryAt(Date.now() + 60000);
      setIsSuccess(!result.error);
      setMessage(isAuthRateLimited(result) ? securityCopy.limited : result.error ? securityCopy.error : securityCopy.reset);
    } catch {
      if (requestId === generation.current) setMessage(securityCopy.error);
    } finally {
      if (requestId === generation.current) {
        busy.current = false;
        setSubmitting(false);
        setCaptchaToken(undefined);
        setCaptchaVersion(value => value + 1);
      }
    }
  }

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitch />
      </div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-tertiary-container rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface-container-lowest rounded-[2.5rem] whisper-shadow overflow-hidden p-10 flex flex-col gap-8">
          <div className="text-left space-y-2">
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">{copy.title}</h1>
            <p className="text-on-surface-variant">
              {copy.subtitle}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-wider text-on-surface-variant font-bold ml-1">{copy.email}</label>
              <input
                className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-surface placeholder:text-outline text-sm"
                placeholder="student@university.edu"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <AuthCaptcha key={captchaVersion} onToken={setCaptchaToken} />
            {message && (
              <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${isSuccess ? 'bg-primary/10 text-on-surface border-primary/20' : 'bg-error/10 text-error border-error/20'}`}>
                {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <Mail className="w-5 h-5 shrink-0 mt-0.5" />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || remaining > 0 || !authReady || (authCaptchaRequired && !captchaToken)}
              className="w-full py-4 px-6 primary-gradient text-on-primary rounded-full font-headline font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {copy.submit}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-on-surface-variant">
              {copy.remembered}
              <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
                {copy.back}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const forgotPasswordCopy = {
  en: {
    title: 'Reset your password',
    subtitle: 'Enter your email and we will send you a secure reset link in the same clean account flow.',
    email: 'Email Address',
    submit: 'Send reset link',
    remembered: 'Remembered it?',
    back: 'Back to log in',
    invalidEmail: 'Enter a valid email address first.',
    sent: 'Password reset email sent.',
  },
  de: {
    title: 'Passwort zurücksetzen',
    subtitle: 'Gib deine E-Mail ein. Wir senden dir einen sicheren Link zum Zurücksetzen.',
    email: 'E-Mail-Adresse',
    submit: 'Reset-Link senden',
    remembered: 'Wieder eingefallen?',
    back: 'Zur Anmeldung',
    invalidEmail: 'Gib zuerst eine gültige E-Mail-Adresse ein.',
    sent: 'Passwort-Reset-E-Mail wurde gesendet.',
  },
};
