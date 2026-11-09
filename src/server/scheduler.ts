import { db } from './db';
import { timers, logs, type Timer } from './db/schema';
import { switchBotClient } from './lib/switchbot';
import { eq } from 'drizzle-orm';

const CHECK_INTERVAL_MS = 15_000;
// スリープ復帰などで間隔が大きく空いた場合に、古いタイマーをまとめて実行しないための上限
const MAX_CATCH_UP_MS = 5 * 60_000;

function formatTime(date: Date) {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

/** (from, to] の範囲に入る分の開始時刻を "HH:MM" で返す */
export function minutesBetween(from: Date, to: Date): Set<string> {
  const result = new Set<string>();
  const start = Math.max(from.getTime(), to.getTime() - MAX_CATCH_UP_MS);
  const cursor = new Date(start);
  cursor.setSeconds(0, 0);
  if (cursor.getTime() <= start) cursor.setMinutes(cursor.getMinutes() + 1);
  while (cursor.getTime() <= to.getTime()) {
    result.add(formatTime(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return result;
}

/**
 * タイマーの全デバイスに turnOn を送り、デバイスごとにログを残す。
 * 1台が失敗しても残りのデバイスには送り続ける。
 */
export async function sendTimerCommands(timer: Timer, triggerType: 'schedule' | 'manual') {
  const failures: { deviceId: string; message: string }[] = [];
  for (const deviceId of timer.deviceIds) {
    try {
      // 'turnOn' は通常、前回の設定を復元して電源を入れる
      await switchBotClient.sendDeviceControl(deviceId, 'turnOn');
      await db.insert(logs).values({ command: 'turnOn', status: 'success', triggerType, timerId: timer.id, deviceId });
    } catch (e: any) {
      console.error(`Failed to send turnOn to ${deviceId} (timer ${timer.id}):`, e);
      failures.push({ deviceId, message: e.message });
      await db.insert(logs).values({
        command: 'turnOn',
        status: 'failure',
        errorMessage: e.message,
        triggerType,
        timerId: timer.id,
        deviceId,
      });
    }
  }
  return { successCount: timer.deviceIds.length - failures.length, failures };
}

async function executeTimer(timer: Timer) {
  console.log(`Executing timer: ${timer.name} for devices ${timer.deviceIds.join(', ')}`);
  const { successCount, failures } = await sendTimerCommands(timer, 'schedule');
  console.log(`Timer ${timer.id} executed: ${successCount} succeeded, ${failures.length} failed.`);

  // 一度実行したら無効にする。
  // 一部のデバイスだけ失敗した場合も、成功したデバイスに翌日また送らないよう無効にする (失敗はログで確認する)
  if (successCount > 0) {
    await db.update(timers).set({ isActive: false }).where(eq(timers.id, timer.id));
  }
}

// 最後にチェックを終えた時刻。ヘルスチェックでスケジューラーが止まっていないかを見るのに使う
let lastTickAt: Date | null = null;

export function getSchedulerLastTickAt() {
  return lastTickAt;
}

export function startScheduler() {
  console.log('Scheduler started');
  lastTickAt = new Date();

  let lastCheck = new Date();
  let running = false;

  setInterval(async () => {
    // 前回のチェックが終わっていなければ、lastCheck を進めずに次回へ回す
    if (running) return;
    running = true;

    const now = new Date();
    const dueTimes = minutesBetween(lastCheck, now);

    try {
      if (dueTimes.size === 0) return;
      console.log(`Checking timers for ${[...dueTimes].join(', ')}`);

      const activeTimers = db.select().from(timers).where(eq(timers.isActive, true)).all();
      for (const timer of activeTimers) {
        // const days = timer.weekdays.split(',');
        // if (dueTimes.has(timer.time) && days.includes(currentDay)) {
        // 繰り返し機能を一時的に無効化し、一度実行したら無効にする
        if (dueTimes.has(timer.time)) {
          await executeTimer(timer);
        }
      }
    } catch (e) {
      console.error('Scheduler error:', e);
    } finally {
      lastCheck = now;
      lastTickAt = new Date();
      running = false;
    }
  }, CHECK_INTERVAL_MS);
}
