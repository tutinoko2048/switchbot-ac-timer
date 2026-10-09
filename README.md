# AC Timer (SwitchBot Scheduler)

SwitchBotデバイス（主にエアコン）をスケジュール制御するためのWebアプリケーションです。
指定した時刻に自動でデバイスをONにするタイマー機能を提供します。

## ✨ Features

- **デバイス一覧取得**: SwitchBot APIから赤外線リモコンデバイスを取得
- **タイマー設定**: 時刻指定での自動実行スケジュール作成
- **バックグラウンド実行**: サーバー内のスケジューラによる定期実行
- **手動実行**: 動作確認用の手動実行機能
- **PWA**: ホーム画面に追加して使える

## 🛠 Tech Stack

- **Frontend**: React + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query), Tailwind CSS
- **API**: [Hono](https://hono.dev/)（RPC でフロントと型を共有）
- **Database**: SQLite（better-sqlite3）+ [Drizzle ORM](https://orm.drizzle.team/)
- **Runtime**: Node.js + [Nub](https://nubjs.com/)（TypeScript を直接実行）
- **Toolchain**: [Vite+](https://viteplus.dev/)（dev / build / lint / fmt）
- **Process Manager**: pm2

## 📂 Project Structure

```
.
├── index.html
├── vite.config.ts        # Vite+ の設定（dev / build / lint / fmt）
├── ecosystem.config.cjs  # pm2 の設定
├── drizzle/              # マイグレーション
├── public/               # sw.js, manifest.webmanifest, アイコン
└── src/
    ├── client/           # React アプリ（routes/ がファイルベースのルーティング）
    └── server/
        ├── app.ts        # Hono のルートと AppType（開発サーバーはここを読む）
        ├── main.ts       # 本番用の入口（配信・スケジューラー）
        ├── env.ts        # 環境変数の検証
        ├── scheduler.ts
        └── db/
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- [pnpm](https://pnpm.io/)
- SwitchBot API Token & Secret（SwitchBot アプリから取得）

### Setup

```bash
pnpm install
cp .env.example .env
```

`.env` に SwitchBot の値を設定します。

```env
SWITCHBOT_TOKEN=your_token_here
SWITCHBOT_SECRET=your_secret_here
# PORT=3001
# DB_PATH=/path/to/sqlite.db  # 省略時はリポジトリ直下の sqlite.db
```

DB のマイグレーションは起動時に自動で実行されます。

### Development

```bash
pnpm dev
```

UI と `/api` が1つの開発サーバーで動きます（http://localhost:5173）。
開発中はスケジューラーは起動しません。

### Lint / Format

```bash
pnpm check   # format・lint・型チェックをまとめて実行
pnpm lint
pnpm fmt
```

## 🚢 Production

```bash
pnpm build
pm2 start ecosystem.config.cjs
```

`nub src/server/main.ts` が `/api`・ビルド済みの UI・スケジューラーを1プロセスで動かします。
更新時は `pnpm build` の後に `pm2 restart ac-timer` します。
