import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { env, migrationsFolder } from '../env';
import * as schema from './schema';

const sqlite = new Database(env.DB_PATH);
export const db = drizzle(sqlite, { schema });

// 開発サーバーと本番の両方で、DB を使う前にマイグレーションを済ませる
migrate(db, { migrationsFolder });
