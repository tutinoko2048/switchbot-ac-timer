import { db } from './db';
import { timers } from './db/schema';
import { switchBotClient } from './lib/switchbot';
import { eq } from 'drizzle-orm';

export function startScheduler() {
  console.log('Scheduler started');
  // Align to the next minute start to be more precise, or just run every 60s.
  // For simplicity, just run every 60s.

  setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay().toString(); // 0-6
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    console.log(`Checking timers for ${currentTime}`);

    try {
      const allTimers = db.select().from(timers).where(eq(timers.isActive, true)).all();

      for (const timer of allTimers) {
        // Check if weekdays includes current day.
        // timer.weekdays is string "0,1,2"
        const days = timer.weekdays.split(',');

        // if (timer.time === currentTime && days.includes(currentDay)) {
        // 繰り返し機能を一時的に無効化し、一度実行したら無効にする
        if (timer.time === currentTime) {
          console.log(`Executing timer: ${timer.name} for device ${timer.deviceId}`);
          try {
            // Basic turnOn. For AC, you might want to set specific settings.
            // 'turnOn' usually restores last state.
            await switchBotClient.sendDeviceControl(timer.deviceId, 'turnOn');
            console.log(`Timer ${timer.id} executed successfully.`);

            // 一度実行したら無効にする
            await db.update(timers).set({ isActive: false }).where(eq(timers.id, timer.id));
          } catch (e) {
            console.error(`Failed to execute timer ${timer.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.error('Scheduler error:', e);
    }
  }, 60_000);
}
