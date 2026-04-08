import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(express.json());

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
}

const users = new Map<string, UserRecord>();

const AI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const geminiApiKey = process.env.GEMINI_API_KEY;
const aiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/auth/signup', (req, res) => {
  const { fullName, email, password } = req.body as { fullName?: string; email?: string; password?: string };

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (users.has(normalizedEmail)) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
  };

  users.set(normalizedEmail, user);

  return res.status(201).json({
    token: `demo-token-${user.id}`,
    user: { id: user.id, fullName: user.fullName, email: user.email },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.get(normalizedEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({
    token: `demo-token-${user.id}`,
    user: { id: user.id, fullName: user.fullName, email: user.email },
  });
});

app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required.' });
  }

  if (!aiClient) {
    return res.json({
      text: `AI backend is connected, but GEMINI_API_KEY is missing.\n\nPrompt received:\n${prompt.trim()}`,
    });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: AI_MODEL,
      contents: `You are an English dictation coach. Generate a clean practice text.\n\nUser request: ${prompt.trim()}`,
    });

    const text = response.text?.trim();

    if (!text) {
      return res.status(502).json({ message: 'Model returned an empty response.' });
    }

    return res.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error.';
    return res.status(500).json({ message });
  }
});

app.post('/api/dictation/grade', (req, res) => {
  const { sourceText, inputText } = req.body as { sourceText?: string; inputText?: string };

  if (!sourceText || !inputText) {
    return res.status(400).json({ message: 'sourceText and inputText are required.' });
  }

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const sourceWords = normalize(sourceText);
  const typedWords = normalize(inputText);

  const comparedLength = Math.max(typedWords.length, 1);
  const correct = typedWords.filter((word, index) => word === sourceWords[index]).length;
  const accuracy = Math.round((correct / comparedLength) * 100);

  return res.json({ accuracy, totalTypedWords: typedWords.length, correctWords: correct });
});

app.listen(PORT, () => {
  console.log(`Wordpilot backend running at http://localhost:${PORT}`);
});
