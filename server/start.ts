import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'preview';
if (isProduction) {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT ?? 3000);
app.listen(port, isProduction ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`WordPilot running at ${process.env.PUBLIC_APP_URL || process.env.APP_URL || `http://localhost:${port}`}`);
});
