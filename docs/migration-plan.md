# 移行計画: Next.js → Vite+ / React / TanStack Router（1パッケージ・Node + Nub）

作業ブランチ: `refactor/migrate-vite-tanstack`

## 完成形

```
/
  package.json            ← "type": "module"。pnpm workspace は廃止
  vite.config.ts          ← Vite+（dev/build/lint/fmt）+ @hono/vite-dev-server
  tsconfig.json           ← tsconfig.client.json と tsconfig.server.json を参照（moduleResolution: bundler）
  index.html
  drizzle.config.ts / drizzle/
  public/                 ← icon.svg, sw.js, manifest.webmanifest
  src/
    client/  main.tsx, routes/__root.tsx, routes/index.tsx, components/, lib/api.ts
    server/  app.ts      ← Hono のルートと AppType（開発サーバーはここを読む）
             main.ts     ← 本番用の入口：serve()、静的ファイルの配信、マイグレーション、スケジューラー
             env.ts, scheduler.ts, switchbot.ts, db/
```

- **開発**: `vp dev` 1つで UI と `/api` の両方が動く。スケジューラーは起動しない
- **本番**: `vp build` の後、pm2 で `nub src/server/main.ts` を1つ起動する
- import に `.ts` の拡張子は付けない。Nub が bundler と同じ方式でパスを解決する

## 技術スタック

| 項目 | 採用 |
|---|---|
| フロント | React + TanStack Router（ファイルベース）+ TanStack Query |
| ビルド / lint / fmt | Vite+（`vp dev` / `vp build` / `vp lint` / `vp fmt` / `vp check`） |
| API | Hono（RPC で型を共有） |
| サーバーの実行環境 | Node + Nub（TypeScript を直接実行） |
| DB | Drizzle + better-sqlite3 |
| スケジューラー | 同じプロセス内で動かす（本番の入口からだけ起動） |
| プロセス管理 | pm2（1プロセス） |

## 手順（コミット単位。どの段階でも動く状態を保つ）

### 1. Docker と nginx を削除

- `docker-compose.yml`、`frontend/Dockerfile`、`backend/Dockerfile`、`.dockerignore`、`nginx/` を削除する
- README の Docker Compose の節を削除する

### 2. backend の Bun 依存を外して Node + Nub で動くようにする（`backend/` の中のまま）

- `bun:sqlite` → `better-sqlite3`、`drizzle-orm/bun-sqlite` → `drizzle-orm/better-sqlite3`
- `drizzle-orm/bun-sqlite/migrator` → `drizzle-orm/better-sqlite3/migrator`
- `better-sqlite3` を devDependencies から dependencies に移す
- 起動部分を `export default { port, fetch }` から `@hono/node-server` の `serve()` に替える
- `@types/bun` → `@types/node`
- scripts を `nub src/index.ts` に変え、ファイル変更時の再起動の方法も決める
- 確認: Next のフロントのまま、今までどおり動くこと

### 3. 設定の整理とスケジューラーの修正

- `env.ts` を作り、`PORT`、`DB_PATH`、SwitchBot のトークンを zod で検証する（DB のパスを起動したディレクトリに依存させない）
- 起動時にマイグレーションを自動で実行する
- `app.ts`（ルートだけ）と `main.ts`（起動処理とスケジューラー）に分ける
- スケジューラーの取りこぼしを直す
  - 今の実装: `setInterval(…, 60_000)` は実行時刻が少しずつずれ、ずれが分の境目をまたぐと1分ぶんのチェックが丸ごと抜けて、その時刻のタイマーが実行されない
  - 直し方: 15秒ごとにチェックし、「前回のチェックから今回のチェックまで」に予定時刻が入っているタイマーを実行する

### 4. monorepo を解体する

- `backend/` の中身を `src/server` とルートに移す
- `package.json` を1つにまとめ、`pnpm-workspace.yaml` は `allowBuilds` などの必要な設定だけ残す
- この段階では `frontend/`（Next）を残し、rewrites で `/api` を server に渡して動く状態を保つ

### 5. Next を Vite+ と TanStack Router に置き換える

- 削除: `next`、`eslint`、`eslint-config-next`、`@tailwindcss/postcss`、`next.config.ts`、`postcss.config.mjs`、`eslint.config.mjs`
- 追加: `vite-plus`、`@vitejs/plugin-react`（React Compiler を有効にする）、`@tailwindcss/vite`、`@tanstack/react-router`、`@tanstack/router-plugin`、`@hono/vite-dev-server`
- `frontend/src` の中身を `src/client` に移し、`'use client'` を消す。`page.tsx` は `routes/index.tsx` にする
- Next 固有の機能を置き換える

  | Next | 置き換え先 |
  |---|---|
  | `metadata` / `viewport` | `index.html` の `<meta>` / `<link>` |
  | `app/manifest.ts` | `public/manifest.webmanifest`（`sw.js` がこの名前でキャッシュしているので名前は変えない） |
  | `next/script` での SW 登録 | `main.tsx` |
  | `next/font/google` | `@fontsource-variable/noto-sans-jp` |
  | `rewrites`（`/api` のプロキシ） | 開発: `@hono/vite-dev-server`、本番: 同じプロセス |
  | `reactCompiler: true` | `@vitejs/plugin-react` の babel 設定 |

- `main.ts` で `dist` を配信する。登録順は `/api` → 静的ファイル → それ以外は `index.html`（SPA のフォールバック）
- 該当するルートがない `/api/*` には JSON の404を返す（`index.html` が返らないようにする）
- `routeTree.gen.ts` はコミットする
- tsconfig から Next 関連の設定を消し、`.gitignore` の `.next` などを `dist` に置き換える

### 6. データ取得を TanStack Query に置き換える

- 手書きの `fetchData` と `setInterval` を `useQuery({ refetchInterval: 10_000 })` に替える
- 作成・更新・削除は `useMutation` で行い、成功したら invalidate する
- 「◯秒前」の表示は `dataUpdatedAt` から計算する

### 7. Service Worker の修正

- `CACHE_NAME` を `v2` に上げ、`activate` で古いキャッシュを消す
- ナビゲーションのリクエストはネットワークファーストにする（古い `index.html` が残ると、存在しないハッシュ付きアセットを読みに行って画面が真っ白になるため）
- `/api` はキャッシュしない

### 8. lint と fmt の設定

- `vite.config.ts` の `lint` と `fmt` を設定する
- scripts を `lint: vp lint`、`fmt: vp fmt`、`check: vp check` にする
- **一括フォーマットは単独のコミット**にして、`.git-blame-ignore-revs` に登録する

### 9. ドキュメントと pm2 の設定

- `ecosystem.config.cjs` を追加する（`script: 'src/server/main.ts'`、`interpreter: 'nub'`）
- README と `plan.md` を新しい構成に合わせて書き直す
- `frontend/README.md` を削除する

## 作業中に確認すること

- Vite+ の上で `@vitejs/plugin-react` と React Compiler、`@hono/vite-dev-server` が動くか
- Nub に watch モードがあるか、pm2 の `interpreter` として指定できるか
- oxlint の react-hooks ルールが React Compiler 用のルールまでカバーしているか（`@tanstack/eslint-plugin-router` は諦める予定）

## 完了の基準

- [ ] `vp dev` で、一覧の表示・作成・編集・削除・有効/無効の切り替え・手動実行ができ、10秒ごとに自動更新される
- [ ] `vp check`（fmt・lint・型チェック）がエラーなしで通る
- [ ] `vp build` の後に `nub src/server/main.ts` で起動でき、`/`、直接開いた URL、`/api`、存在しない `/api` の404がすべて正しく返る
- [ ] 本番でスケジューラーが時刻どおりにタイマーを実行する
- [ ] PWA としてインストールでき、デプロイ後に古い SW から新しい SW に切り替わる

## 本番に反映するときの注意

- pm2 で今動いている frontend と backend の2プロセスを止め、新しい1プロセスに入れ替える
- `sqlite.db` は、`DB_PATH` で指定する場所に移す

## 検討して見送った案

- **rshono**: API と UI が1プロセスにまとまるが、Rspack ベースで Vite+ と両立しない。UI の大部分がクライアントの状態で、RSC の利点が少ない
- **Hono に描画を寄せる（Hono JSX + htmx / HonoX）**: UI がクライアントの状態だらけで、ほぼ書き直しになる
- **TanStack Start**: 1画面の SPA には大きすぎる。常駐スケジューラーや Hono RPC との相性もよくない
- **Bun のまま**: Vite の開発サーバー（Node）の中で `bun:sqlite` が使えず、開発サーバーを1つにまとめられない

## 今回は対象外

- タイマーの `weekdays` を `"0,1,2"` という文字列で持っている点
- 曜日指定の繰り返し実行が無効になっている点（今は一度実行すると無効になる）

## 参考

- [Vite+ Lint](https://viteplus.dev/guide/lint)
- [Nub: Module resolution](https://nubjs.com/docs/runtime/resolution)
- [Nub: Runtime](https://nubjs.com/docs/runtime)
- [vite-plus issue #930](https://github.com/voidzero-dev/vite-plus/issues/930)
- [vite-plus discussion #2669](https://github.com/voidzero-dev/vite-plus/discussions/2669)
