export interface AuthPayload {
  fullName?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface GenerateResponse {
  text: string;
}

export interface GradeResponse {
  accuracy: number;
  totalTypedWords: number;
  correctWords: number;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data as T;
}

export const api = {
  signup: (payload: AuthPayload) => request<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: AuthPayload) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  generateText: (prompt: string) => request<GenerateResponse>('/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt }) }),
  gradeDictation: (sourceText: string, inputText: string) =>
    request<GradeResponse>('/api/dictation/grade', { method: 'POST', body: JSON.stringify({ sourceText, inputText }) }),
};
