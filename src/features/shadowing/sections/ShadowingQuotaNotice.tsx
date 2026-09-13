import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useI18n } from '../../../i18n';
import type { useShadowingQuota } from '../hooks/useShadowingQuota';

export function ShadowingQuotaNotice({ quota }: { quota: ReturnType<typeof useShadowingQuota> }) {
  const { language } = useI18n();
  const de = language === 'de';
  return <section className="mb-6" aria-live="polite" aria-busy={quota.pending}>
    {quota.data && !quota.data.isPro && <p className="text-sm text-on-surface-variant">{quota.data.used} / 3 {de ? 'kostenlose Shadowing-Videos genutzt' : 'free Shadowing videos used'}</p>}
    {quota.error && <p role="alert" className="mt-2 text-sm text-error">{de ? 'Der Zugriff konnte nicht geprüft werden. Bitte versuche es erneut.' : 'We could not check your access. Please try again.'}</p>}
    {quota.blocked && <div role="alert" className="mt-3 border-l-4 border-primary bg-primary/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><LockKeyhole className="h-5 w-5" />{de ? 'Deine 3 kostenlosen Videos sind genutzt.' : "You've used your 3 free videos."}</h2>
      <p className="mt-2 text-sm">{de ? 'Übe deine bisherigen Videos weiter oder wechsle zu Pro für weitere Videos.' : 'Replay your unlocked videos, or upgrade to Pro to practice with more videos.'}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/pricing" className="rounded-lg bg-primary px-4 py-2 font-semibold text-on-primary">{de ? 'Zu Pro wechseln' : 'Upgrade'}</Link>
        <button type="button" onClick={quota.dismiss} className="rounded-lg px-4 py-2 font-semibold">{de ? 'Zurück zu Shadowing' : 'Back to Shadowing'}</button>
      </div>
    </div>}
  </section>;
}
