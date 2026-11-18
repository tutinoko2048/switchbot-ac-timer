import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const AC_MODES = ['auto', 'cool', 'dry', 'fan', 'heat'] as const;
export const AC_FAN_SPEEDS = ['auto', 'low', 'medium', 'high'] as const;

/** エアコンの運転設定。SwitchBot の setAll は3つすべてを必要とするので、まとめて持つ */
export interface AcSettings {
  temperature: number; // ℃
  mode: (typeof AC_MODES)[number];
  fanSpeed: (typeof AC_FAN_SPEEDS)[number];
}

export const timers = sqliteTable('timers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('My Timer'),
  time: text('time').notNull(), // Format: "HH:MM"
  deviceIds: text('device_ids', { mode: 'json' }).$type<string[]>().notNull(), // 例: ["01-xxx", "02-yyy"]
  // null なら turnOn (前回の設定を復元して電源を入れる)、指定があれば setAll でその設定にして電源を入れる
  acSettings: text('ac_settings', { mode: 'json' }).$type<AcSettings>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  executedAt: text('executed_at').default(sql`CURRENT_TIMESTAMP`),
  command: text('command').notNull(),
  status: text('status', { enum: ['success', 'failure'] }).notNull(),
  errorMessage: text('error_message'),
  triggerType: text('trigger_type', { enum: ['schedule', 'manual'] }).notNull(),
  // 複数デバイス対応前のログは null (その場合はタイマーのデバイスを表示する)
  deviceId: text('device_id'),
  timerId: integer('timer_id')
    .references(() => timers.id)
    .notNull(),
});

export type Timer = typeof timers.$inferSelect;
export type NewTimer = typeof timers.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
