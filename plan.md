# SwitchBot エアコン オンタイマー Web アプリ開発計画

## 1. プロジェクト構成
フロントエンドとバックエンドを分離した構成とします。

- Root
  - `frontend/` (Next.js, Node.js, pnpm)
  - `backend/` (Hono, Bun, SQLite)

## 2. 技術スタック
- **Package Manager**: pnpm

### Backend
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite (`bun:sqlite`)
- **ORM**: Drizzle ORM
- **API**: SwitchBot API v1.1

### Frontend
- **Runtime**: Node.js
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Next.js デフォルト)
- **Communication**: Hono RPC (型安全なAPI通信)

## 3. 機能要件

1.  **SwitchBot デバイス連携**
    - SwitchBot API を使用してデバイスリストを取得 (エアコンの ID 特定)
    - エアコンへの ON コマンド送信
2.  **タイマー管理 (DB)**
    - タイマー設定の保存 (時刻, 曜日, 対象デバイスID, 設定温度など)
    - タイマー設定の取得、更新、削除
3.  **スケジューラー (Backend)**
    - 定期的に DB をチェックし、設定時刻になったら SwitchBot API を叩く
4.  **UI (Frontend)**
    - タイマー一覧表示
    - タイマー追加・編集フォーム
    - 手動実行ボタン (テスト用)
    - **スマートフォン対応 (レスポンシブデザイン)**

## 4. 開発ステップ

### Step 1: プロジェクトセットアップ
- [ ] ルートディレクトリの作成
- [ ] `backend` ディレクトリで Bun + Hono プロジェクトの初期化
- [ ] `frontend` ディレクトリで Next.js プロジェクトの初期化 (pnpm)

### Step 2: Backend - データベース & ORM 設定
- [ ] `drizzle-orm`, `drizzle-kit`, `bun:sqlite` のインストール
- [ ] SQLite データベースの接続設定
- [ ] タイマー設定用のスキーマ定義 (`schema.ts`)
- [ ] マイグレーションの実行

### Step 3: Backend - SwitchBot API 連携
- [ ] SwitchBot API クライアントの実装 (署名生成など)
- [ ] デバイス一覧取得 API の実装
- [ ] コマンド送信 API の実装
- [ ] `.env` でトークン管理

### Step 4: Backend - API エンドポイント実装
- [ ] タイマー設定の CRUD (Create, Read, Update, Delete) API の実装
- [ ] **Hono RPC 用の型定義のエクスポート設定**

### Step 5: Backend - スケジューラー実装
- [ ] 定期実行処理の実装 (例: 1分ごとにチェック)
- [ ] 条件に合致するタイマーの実行処理

### Step 6: Frontend - UI 実装
- [ ] **Hono RPC クライアントの設定 (Backendの型定義を利用)**
- [ ] タイマー一覧画面の実装 (**スマホ対応レイアウト**)
- [ ] タイマー登録・編集モーダルまたはページの作成
- [ ] SwitchBot デバイス選択機能

### Step 7: 結合テスト & 調整
- [ ] フロントエンドからタイマーを登録し、バックエンドで正しく動作するか確認
- [ ] エラーハンドリング、UI の微調整
