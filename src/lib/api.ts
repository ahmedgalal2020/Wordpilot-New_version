import type { SavedText, Session } from '@/src/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface DashboardPayload {
  user: { id: string; fullName: string; email: string };
  sessions: Session[];
  savedTexts: SavedText[];
}

export async function getDashboard(email: string): Promise<DashboardPayload> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error('Failed to load dashboard data');
  }

  return response.json();
}

export async function signup(fullName: string, email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Signup failed');
  }

  return payload;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Login failed');
  }

  return payload;
}
