import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { authSecurityCopy } from '../lib/authProtection';

const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
export const authCaptchaRequired = Boolean(sitekey) || import.meta.env.VITE_AUTH_CAPTCHA_REQUIRED === 'true';
type Turnstile = {
  render: (node: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
let scriptPromise: Promise<void> | null = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => { script.remove(); reject(new Error('Security check unavailable')); }, 15000);
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('Security check unavailable')); };
    document.head.appendChild(script);
  }).catch(error => { scriptPromise = null; throw error; });
  return scriptPromise;
}

export function AuthCaptcha({ onToken }: { key?: string | number; onToken: (token: string | undefined) => void }) {
  const { language } = useI18n();
  const copy = authSecurityCopy[language];
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const callback = useRef(onToken);
  callback.current = onToken;
  useEffect(() => {
    if (!authCaptchaRequired) return;
    let active = true;
    let id: string | undefined;
    callback.current(undefined);
    setFailed(!sitekey);
    if (sitekey) void loadTurnstile().then(() => {
      if (!active || !container.current) return;
      if (!window.turnstile) throw new Error('Security check unavailable');
      id = window.turnstile.render(container.current, {
        sitekey, size: 'flexible', theme: 'auto', language,
        callback: (token: string) => { if (active) { setFailed(false); callback.current(token); } },
        'expired-callback': () => { if (active) callback.current(undefined); },
        'error-callback': () => { if (active) { callback.current(undefined); setFailed(true); } },
      });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (id) window.turnstile?.remove(id); };
  }, [language, retry]);
  if (!authCaptchaRequired) return null;
  return <div className="min-w-0" aria-live="polite">
    <div ref={container} />
    {failed && <div role="alert" className="text-sm text-error">
      <p>{copy.captchaError}</p>
      <button type="button" className="mt-2 underline" onClick={() => setRetry(value => value + 1)}>{copy.retry}</button>
    </div>}
  </div>;
}
