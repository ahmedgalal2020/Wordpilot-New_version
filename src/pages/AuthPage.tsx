import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Keyboard,
  LoaderCircle,
  LockKeyhole,
  Mic2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { LanguageSwitch } from '../components/LanguageSwitch';

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
  const { language } = useI18n();
  const copy = authCopy[language];
  const { signIn, signInWithGoogle, signUp, resendConfirmation, authMessage, authReady } = useAuth();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);
  const [sendingConfirmation, setSendingConfirmation] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(authMessage ? { kind: 'info', message: authMessage } : null);
  const [lastAuthError, setLastAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNotice(authMessage ? { kind: 'info', message: authMessage } : null);
  }, [authMessage, isLogin]);

  function validateForm() {
    if (!isValidEmail(email.trim())) {
      return copy.errors.email;
    }

    if (password.trim().length < 8) {
      return copy.errors.passwordLength;
    }

    if (!isLogin) {
      if (fullName.trim().length < 3) {
        return copy.errors.nameLength;
      }

      if (password !== confirmPassword) {
        return copy.errors.passwordMatch;
      }

      if (!agreedToTerms) {
        return copy.errors.terms;
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

      setNotice({ kind: 'success', message: copy.success.login });
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
        message: copy.success.verifyEmail,
      });
      navigate('/login');
      return;
    }

    setNotice({ kind: 'success', message: copy.success.signup });
    navigate('/dashboard');
  }

  async function handleResendConfirmation() {
    setNotice(null);

    if (!isValidEmail(email.trim())) {
      setNotice({ kind: 'error', message: copy.errors.resendEmail });
      return;
    }

    setSendingConfirmation(true);
    const result = await resendConfirmation(email.trim());
    setSendingConfirmation(false);

    if (result.error) {
      setNotice({ kind: 'error', message: result.error });
      return;
    }

    setNotice({ kind: 'success', message: result.message ?? copy.success.confirmationSent });
  }

  async function handleGoogleSignIn() {
    setNotice(null);
    setLastAuthError(null);
    setGoogleSubmitting(true);

    const result = await signInWithGoogle();

    if (result.error) {
      setGoogleSubmitting(false);
      setLastAuthError(result.error);
      setNotice({ kind: 'error', message: result.error });
      return;
    }

    setNotice({ kind: 'info', message: copy.info.googleOpening });
  }

  const submitDisabled = submitting || !authReady || (!isLogin && !agreedToTerms);
  const showResendConfirmation = isLogin && isEmailNotConfirmedError(lastAuthError);

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-grow items-stretch overflow-x-hidden bg-surface">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(0,83,219,0.08)_0%,rgba(255,255,255,0)_36%,rgba(223,213,247,0.20)_100%)]" />
      <div className="wp-shell relative z-10 grid grid-cols-1 gap-6 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:items-start lg:gap-8 lg:py-8">
        <AuthShowcase copy={copy} isLogin={isLogin} />

        <section className="flex items-start justify-center lg:justify-end">
          <div className="w-full max-w-[500px] animate-[fadeIn_0.45s_ease-out] rounded-[2rem] bg-surface-container-lowest p-4 whisper-shadow sm:p-5 lg:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Link
                to="/"
                className="inline-flex items-center focus:outline-none"
              >
                <img src="/wordpilot-logo.svg" alt="WordPilot" className="h-9 w-auto max-w-[160px] object-contain" />
              </Link>
              <LanguageSwitch />
            </div>

            <div className="rounded-[1.5rem] border border-surface-container bg-surface-container-lowest p-5 sm:p-7 lg:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1.5 text-[0.6875rem] font-headline font-bold uppercase tracking-widest text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isLogin ? copy.loginBadge : copy.signupBadge}
                  </span>
                  <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                    {isLogin ? copy.loginTitle : copy.signupTitle}
                  </h1>
                  <p className="max-w-sm text-sm leading-6 text-on-surface-variant sm:text-base">
                    {isLogin ? copy.loginSubtitle : copy.signupSubtitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <SocialButton
                  icon="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  label={copy.google}
                  loading={googleSubmitting}
                  disabled={!authReady || googleSubmitting}
                  onClick={() => void handleGoogleSignIn()}
                />
              </div>

              <div className="my-5 flex items-center gap-4 text-outline-variant">
                <div className="h-px flex-grow bg-surface-container-high"></div>
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest">{copy.emailDivider}</span>
                <div className="h-px flex-grow bg-surface-container-high"></div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {!isLogin && (
                    <FormField
                      label={copy.fullName}
                      placeholder="Ahmed Hassan"
                      type="text"
                      value={fullName}
                      onChange={setFullName}
                      autoComplete="name"
                    />
                  )}

                  <FormField
                    label={copy.email}
                    placeholder="student@wordpilot.app"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />

                  <PasswordField
                    label={copy.password}
                    value={password}
                    onChange={setPassword}
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword((value) => !value)}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />

                  {!isLogin && (
                    <PasswordField
                      label={copy.confirmPassword}
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
                    {copy.resendConfirmation}
                  </button>
                )}

                <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={isLogin ? keepSignedIn : agreedToTerms}
                    onChange={(event) =>
                      isLogin ? setKeepSignedIn(event.target.checked) : setAgreedToTerms(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-outline-variant/40 bg-surface-container-low text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="terms" className="text-xs font-medium leading-5 text-on-surface-variant">
                    {isLogin ? copy.keepSignedIn : copy.acceptTerms}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="primary-gradient group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-headline font-bold tracking-tight text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                  {isLogin ? copy.signIn : copy.createAccount}
                </button>

                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="w-full inline-flex items-center justify-center gap-2 text-sm text-primary font-semibold hover:underline"
                  >
                    {copy.forgotPassword}
                  </Link>
                )}
              </form>

              <div className="mt-6 border-t border-surface-container pt-5 text-center">
                <p className="text-sm text-on-surface-variant">
                  {isLogin ? copy.noAccount : copy.hasAccount}
                  <Link to={isLogin ? '/signup' : '/login'} className="ml-1 font-semibold text-primary hover:underline">
                    {isLogin ? copy.signUpLink : copy.loginLink}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthShowcase({ copy, isLogin }: { copy: (typeof authCopy)['en']; isLogin: boolean }) {
  return (
    <section className="hidden overflow-hidden rounded-[2rem] bg-on-surface p-6 text-on-primary whisper-shadow lg:block xl:p-7">
      <div className="relative z-10 space-y-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-on-primary/10 px-4 py-2 text-[0.6875rem] font-headline font-bold uppercase tracking-widest text-on-primary/85">
          <Sparkles className="h-4 w-4 text-primary-container" />
          {copy.showcaseBadge}
        </span>

        <div className="max-w-xl space-y-4">
          <h2 className="font-headline text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
            {isLogin ? copy.showcaseLoginTitle : copy.showcaseSignupTitle}
          </h2>
          <p className="max-w-lg text-sm leading-6 text-on-primary/72 xl:text-base xl:leading-7">
            {copy.showcaseBody}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {copy.metrics.map((metric) => (
            <MetricPill key={metric.label} value={metric.value} label={metric.label} />
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-3">
        <div className="rounded-[1.5rem] border border-on-primary/10 bg-on-primary/[0.06] p-4 backdrop-blur xl:p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[0.6875rem] font-headline font-bold uppercase tracking-widest text-on-primary/60">
              {copy.sessionLabel}
            </span>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">{copy.sessionStatus}</span>
          </div>
          <div className="space-y-3">
            {copy.sessionRows.map((row, index) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-primary/10">
                  {index === 0 ? <Bot className="h-4 w-4" /> : index === 1 ? <Mic2 className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-on-primary">{row.label}</span>
                    <span className="text-on-primary/60">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-on-primary/10">
                    <div className="h-full rounded-full bg-primary-container" style={{ width: row.width }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:gap-4">
          {copy.features.map((feature) => (
            <FeatureTile key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricPill({ value, label }: { key?: React.Key; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-on-primary/[0.07] px-4 py-3">
      <div className="font-headline text-2xl font-extrabold text-on-primary">{value}</div>
      <div className="mt-1 text-[0.6875rem] font-bold uppercase tracking-widest text-on-primary/50">{label}</div>
    </div>
  );
}

function FeatureTile({ icon: Icon, title, body }: { key?: React.Key; icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-on-primary/[0.07] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-headline text-sm font-bold text-on-primary">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-on-primary/58">{body}</p>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  type: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
      />
    </div>
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
      <label className="ml-1 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <div className="relative">
        <input
          className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 pr-12 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
          placeholder="••••••••"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant/70 transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

const authCopy = {
  en: {
    loginBadge: 'Secure access',
    signupBadge: 'Start your path',
    loginTitle: 'Welcome back',
    signupTitle: 'Create your account',
    loginSubtitle: 'Pick up your AI lessons, dictation sessions, shadowing practice, and progress history in one place.',
    signupSubtitle: 'Set up a personal language workspace that adapts to your level, target language, and daily practice rhythm.',
    showcaseBadge: 'Language practice that feels alive',
    showcaseLoginTitle: 'Your next session is already waiting.',
    showcaseSignupTitle: 'Build a sharper way to learn languages.',
    showcaseBody:
      'WordPilot keeps AI generation, speaking practice, dictation, exercises, and progress review in one focused learning flow.',
    metrics: [
      { value: '4', label: 'Modes' },
      { value: 'A1-C2', label: 'Levels' },
      { value: 'EN/DE', label: 'Core' },
    ],
    sessionLabel: 'Today in WordPilot',
    sessionStatus: 'Ready',
    sessionRows: [
      { label: 'AI lesson prepared', value: '92%', width: '92%' },
      { label: 'Shadowing confidence', value: '76%', width: '76%' },
      { label: 'Dictation accuracy', value: '84%', width: '84%' },
    ],
    features: [
      { icon: Target, title: 'Personal path', body: 'Practice follows your language, level, and goal.' },
      { icon: LockKeyhole, title: 'Saved progress', body: 'Sessions stay connected to your account.' },
    ],
    google: 'Continue with Google',
    emailDivider: 'Or with email',
    fullName: 'Full Name',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    resendConfirmation: 'Resend confirmation email',
    keepSignedIn: 'Keep me signed in on this device',
    acceptTerms: 'I agree to the Terms and Privacy Policy',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    forgotPassword: 'Forgot your password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUpLink: 'Sign up',
    loginLink: 'Log in',
    errors: {
      email: 'Enter a valid email address.',
      passwordLength: 'Password must be at least 8 characters.',
      nameLength: 'Full name must be at least 3 characters.',
      passwordMatch: 'Password confirmation does not match.',
      terms: 'You need to agree to the Terms and Privacy Policy to create an account.',
      resendEmail: 'Enter the same email address you used during signup, then resend confirmation.',
    },
    success: {
      login: 'Signed in successfully. Redirecting to your dashboard...',
      verifyEmail: 'Account created. Check your email and click the confirmation link before signing in.',
      signup: 'Account created successfully. Redirecting to your dashboard...',
      confirmationSent: 'Confirmation email sent.',
    },
    info: {
      googleOpening: 'Opening Google authentication...',
    },
  },
  de: {
    loginBadge: 'Sicherer Zugang',
    signupBadge: 'Lernpfad starten',
    loginTitle: 'Willkommen zurück',
    signupTitle: 'Konto erstellen',
    loginSubtitle: 'Setze KI-Lektionen, Diktat, Shadowing und deinen Fortschritt an einem Ort fort.',
    signupSubtitle: 'Erstelle einen persönlichen Sprachbereich, der zu Niveau, Zielsprache und täglichem Training passt.',
    showcaseBadge: 'Sprachtraining mit Energie',
    showcaseLoginTitle: 'Deine nächste Session wartet schon.',
    showcaseSignupTitle: 'Lerne Sprachen mit einem klareren System.',
    showcaseBody:
      'WordPilot verbindet KI-Generierung, Sprechtraining, Diktat, Übungen und Fortschritt in einem fokussierten Lernfluss.',
    metrics: [
      { value: '4', label: 'Modi' },
      { value: 'A1-C2', label: 'Level' },
      { value: 'EN/DE', label: 'Kern' },
    ],
    sessionLabel: 'Heute in WordPilot',
    sessionStatus: 'Bereit',
    sessionRows: [
      { label: 'KI-Lektion vorbereitet', value: '92%', width: '92%' },
      { label: 'Shadowing-Sicherheit', value: '76%', width: '76%' },
      { label: 'Diktatgenauigkeit', value: '84%', width: '84%' },
    ],
    features: [
      { icon: Target, title: 'Persönlicher Pfad', body: 'Training folgt Sprache, Niveau und Ziel.' },
      { icon: LockKeyhole, title: 'Gespeicherter Fortschritt', body: 'Sessions bleiben mit deinem Konto verbunden.' },
    ],
    google: 'Mit Google fortfahren',
    emailDivider: 'Oder mit E-Mail',
    fullName: 'Vollständiger Name',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    resendConfirmation: 'Bestätigungs-E-Mail erneut senden',
    keepSignedIn: 'Auf diesem Gerät angemeldet bleiben',
    acceptTerms: 'Ich akzeptiere Nutzungsbedingungen und Datenschutz',
    signIn: 'Anmelden',
    createAccount: 'Konto erstellen',
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto?',
    hasAccount: 'Du hast bereits ein Konto?',
    signUpLink: 'Registrieren',
    loginLink: 'Einloggen',
    errors: {
      email: 'Gib eine gültige E-Mail-Adresse ein.',
      passwordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
      nameLength: 'Der vollständige Name muss mindestens 3 Zeichen lang sein.',
      passwordMatch: 'Die Passwortbestätigung stimmt nicht überein.',
      terms: 'Du musst Nutzungsbedingungen und Datenschutz akzeptieren, um ein Konto zu erstellen.',
      resendEmail: 'Gib dieselbe E-Mail-Adresse ein, die du bei der Registrierung genutzt hast.',
    },
    success: {
      login: 'Erfolgreich angemeldet. Weiterleitung zum Dashboard...',
      verifyEmail: 'Konto erstellt. Prüfe deine E-Mail und klicke auf den Bestätigungslink, bevor du dich anmeldest.',
      signup: 'Konto erfolgreich erstellt. Weiterleitung zum Dashboard...',
      confirmationSent: 'Bestätigungs-E-Mail wurde gesendet.',
    },
    info: {
      googleOpening: 'Google-Anmeldung wird geöffnet...',
    },
  },
};

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

function SocialButton({
  icon,
  label,
  loading,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-3 border border-outline-variant/20 rounded-xl bg-surface-container-low/40 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      disabled={disabled}
    >
      {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <img src={icon} alt="" className="w-5 h-5 opacity-70" referrerPolicy="no-referrer" />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}


