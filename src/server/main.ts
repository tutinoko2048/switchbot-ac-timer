import { serve } from '@hono/node-server';
import app from './app';
import { runMigrations } from './db';
import { env } from './env';
import { startScheduler } from './scheduler';

runMigrations();
startScheduler();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
