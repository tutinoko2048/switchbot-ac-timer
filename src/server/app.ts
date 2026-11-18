import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { switchBotClient } from './lib/switchbot';
import { handleMcpRequest } from './mcp';
import { sendTimerCommands } from './scheduler';
import {
  createTimer,
  deleteTimer,
  getHealth,
  getTimer,
  listLogs,
  listTimers,
  timerSchema,
  updateTimer,
} from './timers';

const app = new Hono();

// Uptime Kuma などの監視用。異常時は 503 を返す
app.get('/api/health', (c) => {
  const { ok, body } = getHealth();
  return c.json(body, ok ? 200 : 503);
});

// エージェント (LLM) 向けの MCP (Streamable HTTP)。/api と同じく認証はない
app.post('/mcp', handleMcpRequest);
// セッションを持たないので、サーバーからの通知用の GET (SSE) やセッション終了の DELETE は受け付けない
app.all('/mcp', (c) =>
  c.json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null }, 405, { Allow: 'POST' }),
);

const routes = app
  .get('/api/devices', async (c) => {
    try {
      const data = await switchBotClient.getDevices();
      return c.json(data);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  })
  .get('/api/timers', (c) => c.json(listTimers()))
  .get('/api/logs', (c) => c.json(listLogs()))
  .post('/api/timers', zValidator('json', timerSchema), (c) => {
    const timer = createTimer(c.req.valid('json'));
    console.log('Created timer:', timer);
    return c.json(timer);
  })
  .put('/api/timers/:id', zValidator('json', timerSchema), (c) => {
    const timer = updateTimer(parseInt(c.req.param('id')), c.req.valid('json'));
    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404);
    }
    console.log('Updated timer:', timer);
    return c.json(timer);
  })
  .delete('/api/timers/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    if (!deleteTimer(id)) {
      return c.json({ error: 'Timer not found' }, 404);
    }
    console.log('Deleted timer with id:', id);
    return c.json({ success: true });
  })
  .post('/api/timers/:id/test', async (c) => {
    const timer = getTimer(parseInt(c.req.param('id')));
    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404);
    }

    const { successCount, failures } = await sendTimerCommands(timer, 'manual');
    if (failures.length > 0) {
      const error = failures.map((f) => `${f.deviceId}: ${f.message}`).join('\n');
      return c.json({ error, successCount, failureCount: failures.length }, 500);
    }
    return c.json({ successCount });
  });

// 該当するルートがない /api/* は、SPA の index.html ではなく JSON の404を返す
app.all('/api/*', (c) => c.json({ error: 'Not Found' }, 404));

export type AppType = typeof routes;

export default app;
