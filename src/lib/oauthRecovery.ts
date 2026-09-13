export type OAuthFailure = 'cancelled' | 'error';

export function readOAuthFailure(search: string, hash: string): OAuthFailure | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const code = query.get('error') || fragment.get('error');
  if (code === 'access_denied') return 'cancelled';
  return code || query.has('error_description') || fragment.has('error_description') ? 'error' : null;
}

// A stalled provider must never hold the login controls indefinitely.
export async function withAuthDeadline<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Authentication timed out')), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export const oauthMessages = {
  en: {
    cancelled: 'Sign-in was cancelled. You can try again.',
    error: "We couldn't sign you in. Please try again.",
  },
  de: {
    cancelled: 'Die Anmeldung wurde abgebrochen. Du kannst es erneut versuchen.',
    error: 'Die Anmeldung hat nicht funktioniert. Bitte versuche es erneut.',
  },
};
