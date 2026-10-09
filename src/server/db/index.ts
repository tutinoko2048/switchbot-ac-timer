import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { env, migrationsFolder } from '../env';
import * as schema from './schema';

const sqlite = new Database(env.DB_PATH);
// better-sqlite3 は外部キー制約が既定で有効だが、bun:sqlite では無効だった。
// ログは削除済みのタイマーを参照し続ける (「削除されたタイマー」と表示する) 前提なので無効のままにする
sqlite.pragma('foreign_keys = OFF');
export const db = drizzle(sqlite, { schema });

// 開発サーバーと本番の両方で、DB を使う前にマイグレーションを済ませる
migrate(db, { migrationsFolder });
