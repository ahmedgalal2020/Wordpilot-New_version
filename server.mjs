import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });

const app = express();
const port = Number(process.env.PORT || 8787);
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'wordpilot-backend', timestamp: new Date().toISOString() });
});

app.post('/api/ai/generate', async (req, res) => {
  const { prompt, systemInstruction } = req.body ?? {};

  if (typeof prompt !== 'string' || prompt.trim().length < 2) {
    return res.status(400).json({ error: 'prompt is required and must be at least 2 characters.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      ...(typeof systemInstruction === 'string' && systemInstruction.trim().length > 0
        ? { config: { systemInstruction } }
        : {}),
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: 'Model did not return text output.' });
    }

    return res.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(502).json({ error: 'Failed to generate content from model.', details: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Wordpilot backend running on http://localhost:${port}`);
});
