import express from 'express';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

const users = [];
const texts = [];
const sessions = [];
const settings = [];

const createToken = (user) => Buffer.from(`${user.id}:${user.email}`).toString('base64url');
const parseToken = (token) => {
  try {
    const [id] = Buffer.from(token, 'base64url').toString('utf8').split(':');
    return id;
  } catch {
    return null;
  }
};

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token ? parseToken(token) : null;
  const user = userId ? users.find((u) => u.id === userId) : null;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  next();
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (users.some((u) => u.email === email)) return res.status(409).json({ message: 'Email already exists' });

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    isPremium: false,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  settings.push({ id: crypto.randomUUID(), userId: user.id, language: 'English', targetLevel: 'B2', speechRate: 1, wordGap: 0.5 });

  const token = createToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = createToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const { id, name, email, isPremium } = req.user;
  res.json({ id, name, email, isPremium });
});

app.get('/api/texts', auth, (req, res) => {
  res.json(texts.filter((t) => t.userId === req.user.id));
});

app.post('/api/texts', auth, (req, res) => {
  const { title, content, level, category } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'title and content required' });
  const text = { id: crypto.randomUUID(), userId: req.user.id, title, content, level: level || 'B2', category: category || 'General', createdAt: new Date().toISOString() };
  texts.unshift(text);
  res.status(201).json(text);
});

app.get('/api/sessions', auth, (req, res) => {
  res.json(sessions.filter((s) => s.userId === req.user.id));
});

app.post('/api/sessions', auth, (req, res) => {
  const { title, sourceText, userInput, language, score } = req.body;
  const session = { id: crypto.randomUUID(), userId: req.user.id, title: title || 'Untitled Session', sourceText: sourceText || '', userInput: userInput || '', language: language || 'English', score: Number(score || 0), createdAt: new Date().toISOString() };
  sessions.unshift(session);
  res.status(201).json(session);
});

app.get('/api/settings', auth, (req, res) => {
  const userSettings = settings.find((s) => s.userId === req.user.id);
  res.json(userSettings);
});

app.put('/api/settings', auth, (req, res) => {
  const idx = settings.findIndex((s) => s.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Settings not found' });
  settings[idx] = { ...settings[idx], ...req.body };
  res.json(settings[idx]);
});

app.post('/api/ai/generate', auth, (req, res) => {
  const { prompt = '', level = 'B2', topic = 'General English' } = req.body;
  const generatedText = `Title: ${topic} (${level})\n\nThis generated text is based on: ${prompt || 'custom user instruction'}. Use it as a dictation source and save it to your workspace.`;
  res.json({ generatedText });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
