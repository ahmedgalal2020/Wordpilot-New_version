export interface Session {
  id: string;
  date: string;
  title: string;
  language: string;
  score: number;
}

export interface SavedText {
  id: string;
  title: string;
  level: string;
  category: string;
  icon: 'book' | 'history';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
}

export interface ApiSession {
  id: string;
  title: string;
  language: string;
  score: number;
  createdAt: string;
}

export interface ApiText {
  id: string;
  title: string;
  content: string;
  level: string;
  category: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  language: string;
  targetLevel: string;
  speechRate: number;
  wordGap: number;
}
