const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export async function fetchApi(path: string, init?: RequestInit) {
  const url = apiUrl(path);

  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('WordPilot could not connect to the service right now. Please try again in a moment.');
    }

    throw error;
  }
}