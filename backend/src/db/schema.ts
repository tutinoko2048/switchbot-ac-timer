import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const timers = sqliteTable('timers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('My Timer'),
  time: text('time').notNull(), // Format: "HH:MM"
  weekdays: text('weekdays').notNull(), // Format: "0,1,2,3,4,5,6" (0=Sun)
  deviceId: text('device_id').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Timer = typeof timers.$inferSelect;
export type NewTimer = typeof timers.$inferInsert;
