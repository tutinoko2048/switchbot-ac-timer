import { db } from './db';
import { timers, logs, type AcSettings, type Timer } from './db/schema';
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

const MODE_CODES = { auto: 1, cool: 2, dry: 3, fan: 4, heat: 5 } as const;
const FAN_SPEED_CODES = { auto: 1, low: 2, medium: 3, high: 4 } as const;

/** setAll のパラメーター "{温度},{モード},{風量},{電源}" を組み立てる (例: "26,2,1,on") */
export function toSetAllParameter({ temperature, mode, fanSpeed }: AcSettings) {
  return `${temperature},${MODE_CODES[mode]},${FAN_SPEED_CODES[fanSpeed]},on`;
}

type SendResult = { deviceId: string; command: string } & (
  | { status: 'success' }
  | { status: 'failure'; errorMessage: string }
);

/**
 * デバイスの電源を入れる。
 * 運転設定があれば setAll でその設定にし、なければ turnOn (通常は前回の設定を復元する) を送る。
 * 1台が失敗しても残りのデバイスには送り続ける。onResult はデバイスごとに呼ばれる (ログを残すのに使う)
 */
export async function sendTurnOnCommands(
  deviceIds: string[],
  acSettings: AcSettings | null,
  onResult?: (result: SendResult) => Promise<unknown>,
) {
  const parameter = acSettings ? toSetAllParameter(acSettings) : undefined;
  // ログにはどの設定で送ったかも残す (例: "setAll 26,2,1,on")
  const command = parameter ? `setAll ${parameter}` : 'turnOn';

  const failures: { deviceId: string; message: string }[] = [];
  for (const deviceId of deviceIds) {
    try {
      if (parameter) {
        await switchBotClient.sendDeviceControl(deviceId, 'setAll', parameter);
      } else {
        await switchBotClient.sendDeviceControl(deviceId, 'turnOn');
      }
      await onResult?.({ deviceId, command, status: 'success' });
    } catch (e: any) {
      console.error(`Failed to send ${command} to ${deviceId}:`, e);
      failures.push({ deviceId, message: e.message });
      await onResult?.({ deviceId, command, status: 'failure', errorMessage: e.message });
    }
  }
  return { successCount: deviceIds.length - failures.length, failures };
}

/** タイマーの全デバイスの電源を入れ、デバイスごとにログを残す */
export async function sendTimerCommands(timer: Timer, triggerType: 'schedule' | 'manual') {
  return sendTurnOnCommands(timer.deviceIds, timer.acSettings, (result) =>
    db.insert(logs).values({ ...result, triggerType, timerId: timer.id }),
  );
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
        // 繰り返しはせず、一度実行したら無効にする
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
