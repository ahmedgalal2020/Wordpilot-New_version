import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.API_PORT || 4000);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/dashboard/:email', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { email: req.params.email },
    include: {
      sessions: { orderBy: { createdAt: 'desc' } },
      savedTexts: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email
    },
    sessions: user.sessions.map((session) => ({
      id: session.id,
      date: session.dateLabel,
      title: session.title,
      language: session.language,
      score: session.score
    })),
    savedTexts: user.savedTexts
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email, and password are required' });
  }

  try {
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: password }
    });

    return res.status(201).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    throw error;
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email
    }
  });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
