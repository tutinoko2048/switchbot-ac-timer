import type { Context } from 'hono';
import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { sendTimerCommands, sendTurnOnCommands } from './scheduler';
import {
  acSettingsSchema,
  createTimer,
  deleteTimer,
  getHealth,
  getTimer,
  listInfraredRemotes,
  listLogs,
  listTimers,
  timerSchema,
  updateTimer,
} from './timers';

function json(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function error(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

const timerNotFound = (id: number) => error(`タイマー (id: ${id}) が見つかりません。list_timers で確認してください`);

const idInput = z.number().int().describe('タイマーの ID (list_timers で確認できる)');

const timerInput = {
  name: z.string().describe('タイマーの名前'),
  time: timerSchema.shape.time.describe('実行する時刻。サーバーのローカル時刻で "HH:MM" (24時間表記)'),
  deviceIds: z.array(z.string()).min(1).describe('電源を入れるデバイスの ID (list_devices で確認できる)'),
  acSettings: acSettingsSchema
    .nullable()
    .describe(
      'エアコンの運転設定 (温度・モード・風量)。null なら前回の設定のまま電源を入れる。エアコン以外のデバイスには指定しない',
    ),
  isActive: z.boolean().describe('有効かどうか。無効のタイマーは実行されない'),
};

function createMcpServer() {
  const server = new McpServer({ name: 'ac-timer', version: '1.0.0' });

  server.registerTool(
    'list_timers',
    {
      description:
        'タイマーの一覧を時刻順に返す。タイマーは指定時刻にデバイスの電源を入れる。繰り返しはせず、実行されると isActive が false になる',
      annotations: { readOnlyHint: true },
    },
    () => json(listTimers()),
  );

  server.registerTool(
    'create_timer',
    {
      description:
        'タイマーを作成する。次にその時刻になったときに1回だけ実行される。デバイス ID が分からなければ先に list_devices を呼ぶ',
      inputSchema: {
        ...timerInput,
        name: timerInput.name.default('アラーム'),
        acSettings: timerInput.acSettings.default(null),
        isActive: timerInput.isActive.default(true),
      },
    },
    (input) => json(createTimer(input)),
  );

  server.registerTool(
    'update_timer',
    {
      description:
        'タイマーを更新する。指定した項目だけが変わる。実行済みのタイマーをもう一度使うには isActive を true にする',
      inputSchema: {
        id: idInput,
        name: timerInput.name.optional(),
        time: timerInput.time.optional(),
        deviceIds: timerInput.deviceIds.optional(),
        acSettings: timerInput.acSettings.optional(),
        isActive: timerInput.isActive.optional(),
      },
      annotations: { idempotentHint: true },
    },
    ({ id, ...input }) => {
      const timer = updateTimer(id, input);
      return timer ? json(timer) : timerNotFound(id);
    },
  );

  server.registerTool(
    'delete_timer',
    {
      description: 'タイマーを削除する。実行ログは残る',
      inputSchema: { id: idInput },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => (deleteTimer(id) ? json({ success: true }) : timerNotFound(id)),
  );

  server.registerTool(
    'test_timer',
    {
      description:
        'タイマーを今すぐ実行する (実際にデバイスの電源が入る)。タイマーの時刻や isActive は変わらない。デバイスごとの成否を返す',
      inputSchema: { id: idInput },
      annotations: { openWorldHint: true },
    },
    async ({ id }) => {
      const timer = getTimer(id);
      if (!timer) return timerNotFound(id);

      const result = await sendTimerCommands(timer, 'manual');
      return { ...json(result), isError: result.failures.length > 0 };
    },
  );

  server.registerTool(
    'turn_on_devices',
    {
      description:
        'タイマーを使わずに、指定したデバイスの電源を今すぐ入れる。タイマーは作成・変更されず、実行ログにも残らない。デバイスごとの成否を返す',
      inputSchema: {
        deviceIds: timerInput.deviceIds,
        acSettings: timerInput.acSettings.optional(),
      },
      annotations: { openWorldHint: true },
    },
    async ({ deviceIds, acSettings }) => {
      const result = await sendTurnOnCommands(deviceIds, acSettings ?? null);
      return { ...json(result), isError: result.failures.length > 0 };
    },
  );

  server.registerTool(
    'list_devices',
    {
      description: 'タイマーに設定できる SwitchBot の赤外線リモコン (エアコンなど) の ID・名前・種類を返す',
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => {
      try {
        const remotes = await listInfraredRemotes();
        return json(remotes.map(({ deviceId, deviceName, remoteType }) => ({ deviceId, deviceName, remoteType })));
      } catch (e: any) {
        return error(`デバイス一覧を取得できませんでした: ${e.message}`);
      }
    },
  );

  server.registerTool(
    'get_logs',
    {
      description:
        'タイマーの実行ログを新しい順に返す。executedAt は UTC。command は送ったコマンドで、"setAll 26,2,1,on" は温度26℃・モード2・風量1での運転を表す',
      inputSchema: { limit: z.number().int().min(1).max(100).default(15).describe('取得する件数') },
      annotations: { readOnlyHint: true },
    },
    ({ limit }) => json(listLogs(limit)),
  );

  server.registerTool(
    'health',
    {
      description:
        'サーバーの状態 (DB・スケジューラー) と現在のサーバー時刻を返す。スケジューラーが stale ならタイマーは実行されていない',
      annotations: { readOnlyHint: true },
    },
    () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return json({
        ...getHealth().body,
        // タイマーの time はこの時刻 (サーバーのローカル時刻) と比較される
        serverTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    },
  );

  return server;
}

/**
 * セッションを持たないので、リクエストごとにサーバーとトランスポートを作る。
 * (1つのトランスポートを使い回すと、別々のクライアントのリクエスト ID が衝突しうる)
 */
export async function handleMcpRequest(c: Context) {
  const server = createMcpServer();
  const transport = new StreamableHTTPTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return (await transport.handleRequest(c)) ?? c.body(null, 204);
}
