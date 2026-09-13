// Bound auth network waits without changing the Supabase session or token model.
export const authFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes('/auth/v1/')) return fetch(input, init);
  const controller = new AbortController();
  const original = init?.signal ?? (input instanceof Request ? input.signal : null);
  const abort = () => controller.abort();
  if (original?.aborted) abort();
  original?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 12000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    original?.removeEventListener('abort', abort);
  }
};
