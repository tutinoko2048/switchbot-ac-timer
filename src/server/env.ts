import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DB_PATH: z.string().default(`${rootDir}sqlite.db`),
  SWITCHBOT_TOKEN: z.string().min(1),
  SWITCHBOT_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);

export const migrationsFolder = `${rootDir}drizzle`;
export const distDir = `${rootDir}dist`;
