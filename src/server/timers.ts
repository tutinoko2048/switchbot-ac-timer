import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { AC_FAN_SPEEDS, AC_MODES, logs, timers } from './db/schema';
import { switchBotClient } from './lib/switchbot';
import { getSchedulerLastTickAt } from './scheduler';

// Web API と MCP の両方から使う操作をここにまとめる

export const acSettingsSchema = z.object({
  temperature: z.number().int().min(16).max(30),
  mode: z.enum(AC_MODES),
  fanSpeed: z.enum(AC_FAN_SPEEDS),
});

export const timerSchema = z.object({
  name: z.string().default('My Timer'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  deviceIds: z.array(z.string()).min(1),
  acSettings: acSettingsSchema.nullable().default(null),
  isActive: z.boolean().default(true),
});

export type TimerInput = z.infer<typeof timerSchema>;

export function listTimers() {
  return db.select().from(timers).orderBy(timers.time).all();
}

export function getTimer(id: number) {
  return db.select().from(timers).where(eq(timers.id, id)).get();
}

export function createTimer(input: TimerInput) {
  return db.insert(timers).values(input).returning().get();
}

/** 指定した項目だけを更新する。タイマーがなければ undefined を返す */
export function updateTimer(id: number, input: Partial<TimerInput>) {
  return db
    .update(timers)
    .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(timers.id, id))
    .returning()
    .get();
}

/** 削除できたら true、タイマーがなければ false を返す */
export function deleteTimer(id: number) {
  return db.delete(timers).where(eq(timers.id, id)).run().changes > 0;
}

export function listLogs(limit = 15) {
  return db.select().from(logs).orderBy(desc(logs.executedAt), desc(logs.id)).limit(limit).all();
}

/** タイマーに設定できる赤外線リモコン (エアコンなど) の一覧 */
export async function listInfraredRemotes() {
  const data = await switchBotClient.getDevices();
  return data.body?.infraredRemoteList ?? [];
}

// スケジューラーのチェック間隔 (15秒) に対して、これ以上止まっていたら異常とみなす
const SCHEDULER_STALE_MS = 60_000;

export function getHealth() {
  let dbOk = true;
  try {
    db.get(sql`select 1`);
  } catch (e) {
    console.error('Health check: DB error:', e);
    dbOk = false;
  }

  // 開発サーバーではスケジューラーを起動しないので null になる
  const lastTickAt = getSchedulerLastTickAt();
  const schedulerOk = !lastTickAt || Date.now() - lastTickAt.getTime() < SCHEDULER_STALE_MS;

  const ok = dbOk && schedulerOk;
  return {
    ok,
    body: {
      status: ok ? 'ok' : 'error',
      db: dbOk ? 'ok' : 'error',
      scheduler: { status: schedulerOk ? 'ok' : 'stale', lastTickAt },
      uptime: Math.floor(process.uptime()),
    },
  };
}
