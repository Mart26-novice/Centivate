import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './api/app.ts';

const PORT = 3000;

async function startServer() {
  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Centivate Complaint System server running on http://0.0.0.0:${PORT}`);
  });
}

export { app };

if (process.env.VERCEL !== '1') {
  startServer();
}

