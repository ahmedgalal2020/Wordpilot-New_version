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
