export type AuthFailure = { status?: number; code?: string; error?: string | null };

export function isAuthRateLimited(value: AuthFailure) {
  return value.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit', 'over_sms_send_rate_limit'].includes(value.code ?? '');
}

export function isCredentialFailure(value: AuthFailure) {
  return ['invalid_credentials', 'email_not_confirmed'].includes(value.code ?? '');
}

// UX only. Supabase's server-side limits and CAPTCHA are the security boundary.
// Only bounded timestamps are kept in memory; never email addresses or credentials.
export function createPasswordAttemptGuard() {
  let failures: number[] = [];
  let strikes = 0;
  let until = 0;
  let lastFailure = 0;
  return {
    remaining(now = Date.now()) { return Math.max(0, Math.ceil((until - now) / 1000)); },
    failed(now = Date.now()) {
      if (now < until) return;
      if (now - lastFailure > 30 * 60_000) strikes = 0;
      lastFailure = now;
      failures = failures.filter(time => now - time < 60_000);
      failures.push(now);
      if (failures.length >= 5) {
        until = now + [60_000, 300_000, 900_000][Math.min(strikes++, 2)];
        failures = [];
      }
    },
    rateLimited(now = Date.now()) { until = Math.max(until, now + 60_000); },
    succeeded() { failures = []; strikes = 0; until = 0; lastFailure = 0; },
  };
}

export const passwordAttemptGuard = createPasswordAttemptGuard();
export const authSecurityCopy = {
  en: {
    credentials: 'Email or password is incorrect.',
    error: 'We could not complete your request. Please try again.',
    limited: 'Too many attempts. Please wait a moment and try again.',
    cooldown: (seconds: number) => 'Too many unsuccessful attempts. Please try again in ' + seconds + ' seconds.',
    reset: 'If an account exists for this email, password reset instructions will be sent.',
    confirmation: 'If confirmation is needed for this email, instructions will be sent.',
    signup: 'Check your email for the next steps. If you already have an account, you can sign in or reset your password.',
    captcha: 'Please complete the security check.',
    captchaError: 'The security check is unavailable. Please retry.',
    retry: 'Retry security check',
  },
  de: {
    credentials: 'E-Mail-Adresse oder Passwort ist falsch.',
    error: 'Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut.',
    limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
    cooldown: (seconds: number) => 'Zu viele fehlgeschlagene Versuche. Bitte versuche es in ' + seconds + ' Sekunden erneut.',
    reset: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, werden Anweisungen zum Zurücksetzen gesendet.',
    confirmation: 'Falls diese E-Mail-Adresse bestätigt werden muss, werden Anweisungen gesendet.',
    signup: 'Prüfe deine E-Mails für die nächsten Schritte. Bei einem bestehenden Konto kannst du dich anmelden oder das Passwort zurücksetzen.',
    captcha: 'Bitte schließe die Sicherheitsprüfung ab.',
    captchaError: 'Die Sicherheitsprüfung ist nicht verfügbar. Bitte versuche es erneut.',
    retry: 'Sicherheitsprüfung wiederholen',
  },
};
