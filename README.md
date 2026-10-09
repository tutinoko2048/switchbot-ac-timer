# AC Timer (SwitchBot Scheduler)

SwitchBotデバイス（主にエアコン）をスケジュール制御するためのWebアプリケーションです。
指定した曜日・時刻に自動でデバイスをONにするタイマー機能を提供します。

## ✨ Features

- **デバイス一覧取得**: SwitchBot APIから赤外線リモコンデバイスを取得
- **タイマー設定**: 曜日指定、時刻指定での自動実行スケジュール作成
- **バックグラウンド実行**: バックエンドのスケジューラによる定期実行
- **手動実行**: 動作確認用の手動実行機能

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Hono Client (RPC)

### Backend
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: SQLite
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **External API**: SwitchBot API v1.1

## 📂 Project Structure

This project is a monorepo managed by `pnpm`.

```
.
├── backend/    # Hono API Server & Scheduler
└── frontend/   # Next.js Web Application
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (for backend runtime)
- [pnpm](https://pnpm.io/) (package manager)
- SwitchBot API Token & Secret (Get them from the SwitchBot App)

### Installation

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Backend Setup**
    
    Create `.env` file in `backend/` directory based on `.env.example`.
    
    ```bash
    cp backend/.env.example backend/.env
    ```
    
    Edit `backend/.env` and set your SwitchBot credentials:
    ```env
    SWITCHBOT_TOKEN=your_token_here
    SWITCHBOT_SECRET=your_secret_here
    ```

    Initialize the SQLite database:
    ```bash
    cd backend
    pnpm run migrate
    ```

3.  **Run Development Servers**

    You need to run both backend and frontend terminals.

    **Backend** (Terminal 1):
    ```bash
    cd backend
    pnpm dev
    ```
    Server runs on: http://localhost:3001

    **Frontend** (Terminal 2):
    ```bash
    cd frontend
    pnpm dev
    ```
    App runs on: http://localhost:3000

## 🚢 Production

### Backend

```bash
cd backend
pnpm start
```

### Frontend

Next.jsアプリケーションをビルドしてから起動

```bash
cd frontend
pnpm build
pnpm start
```
