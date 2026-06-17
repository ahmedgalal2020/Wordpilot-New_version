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
      throw new Error(
        `Could not reach the WordPilot API at ${url}. Make sure the backend server is running and VITE_API_BASE_URL points to it in production.`,
      );
    }

    throw error;
  }
}
