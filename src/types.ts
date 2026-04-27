export interface Session {
  id: string;
  date: string;
  title: string;
  language: string;
  score: number;
  sourceText?: string;
  inputText?: string;
  cefrLevel?: string;
}

export interface SavedText {
  id: string;
  title: string;
  level: string;
  category: string;
  icon: 'book' | 'history';
  body?: string;
  source?: string;
  createdAt?: string;
}

export interface Certificate {
  id: string;
  title: string;
  score: number;
  language: string;
  issuedAt: string;
  level: string;
  sessionTitle: string;
}

export interface BillingInvoice {
  id: string;
  label: string;
  amount: string;
  status: 'paid' | 'upcoming';
  issuedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
