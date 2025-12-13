import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from './db';
import { timers, logs } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import { switchBotClient } from './lib/switchbot';
import { startScheduler } from './scheduler';

const app = new Hono();

startScheduler();

app.use('/*', cors());

const timerSchema = z.object({
  name: z.string().default('My Timer'),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  weekdays: z.string(), // "0,1,2"
  deviceId: z.string(),
  isActive: z.boolean().default(true),
});

const routes = app
  .get('/api/devices', async (c) => {
    try {
      const data = await switchBotClient.getDevices();
      return c.json(data);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  })
  .get('/api/timers', async (c) => {
    const allTimers = db.select().from(timers).all();
    return c.json(allTimers);
  })
  .get('/api/logs', async (c) => {
    const allLogs = db.select().from(logs).orderBy(desc(logs.executedAt)).limit(10).all();
    return c.json(allLogs);
  })
  .post('/api/timers', zValidator('json', timerSchema), async (c) => {
    const data = c.req.valid('json');
    const result = await db.insert(timers).values(data).returning();
    console.log('Created timer:', result);
    return c.json(result[0]);
  })
  .put('/api/timers/:id', zValidator('json', timerSchema), async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    const result = await db.update(timers).set(data).where(eq(timers.id, id)).returning();
    console.log('Updated timer:', result);
    return c.json(result[0]);
  })
  .delete('/api/timers/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.delete(timers).where(eq(timers.id, id));
    console.log('Deleted timer with id:', id);
    return c.json({ success: true });
  })
  .post('/api/timers/:id/test', async (c) => {
    const id = parseInt(c.req.param('id'));
    const timer = db.select().from(timers).where(eq(timers.id, id)).get();

    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404);
    }

    // Turn on AC, default settings
    try {
      const result = await switchBotClient.sendDeviceControl(timer.deviceId, 'turnOn');
      await db.insert(logs).values({
        command: 'turnOn',
        status: 'success',
        triggerType: 'manual',
        timerId: timer.id,
      });

      return c.json(result);
    } catch (e: any) {
      await db.insert(logs).values({
        command: 'turnOn',
        status: 'failure',
        errorMessage: e.message,
        triggerType: 'manual',
        timerId: timer.id,
      });
      return c.json({ error: e.message }, 500);
    }
  });

export type AppType = typeof routes;

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  fetch: app.fetch,
};
