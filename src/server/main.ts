import { readFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import app from './app';
import { distDir, env } from './env';
import { startScheduler } from './scheduler';

startScheduler();

const indexHtml = await readFile(`${distDir}/index.html`, 'utf-8');

// 登録順: /api → 静的ファイル → それ以外は index.html (SPA のフォールバック)
const server = new Hono()
  .route('/', app)
  .use('/*', serveStatic({ root: distDir }))
  .get('*', (c) => c.html(indexHtml));

serve({ fetch: server.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
