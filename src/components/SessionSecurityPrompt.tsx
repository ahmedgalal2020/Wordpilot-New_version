import { LoaderCircle, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function SessionSecurityPrompt() {
  const {
    user,
    sessionSecurity: { idleWarningVisible, secondsUntilSignOut, continueSession, signOutNow },
  } = useAuth();
  const [working, setWorking] = React.useState<'continue' | 'signout' | null>(null);

  if (!user || !idleWarningVisible) {
    return null;
  }

  async function handleContinue() {
    setWorking('continue');
    await continueSession();
    setWorking(null);
  }

  async function handleSignOut() {
    setWorking('signout');
    await signOutNow();
    setWorking(null);
  }

  const minutes = Math.floor(secondsUntilSignOut / 60);
  const seconds = secondsUntilSignOut % 60;
  const countdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-black text-on-surface">Are you still here?</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              For account security, WordPilot will sign you out after inactivity. Continue within {countdown} to keep this session active.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={working !== null}
            className="rounded-full bg-surface-container px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-high disabled:opacity-70"
          >
            {working === 'signout' ? 'Signing out...' : 'Sign out'}
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={working !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-dim disabled:opacity-70"
          >
            {working === 'continue' && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Continue session
          </button>
        </div>
      </div>
    </div>
  );
}
