import { Log, SwitchBotInfraredRemote, Timer } from '@/types';
import { formatDeviceNames } from '@/lib/devices';

interface LogListProps {
  logs: Log[];
  devices: SwitchBotInfraredRemote[];
  timers: Timer[];
}

export function LogList({ logs, devices, timers }: LogListProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    // SQLiteのCURRENT_TIMESTAMPはUTCだがタイムゾーン情報がないため、Zを付与してUTCとして扱う
    // また、Safari等での互換性のため " " を "T" に置換する
    const isoString = dateStr.replace(' ', 'T') + (dateStr.endsWith('Z') ? '' : 'Z');
    return new Date(isoString).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (logs.length === 0) {
    return <div className="text-gray-500 text-center py-4">ログはありません</div>;
  }

  return (
    <div className="space-y-1.5">
      {logs.map((log) => {
        const timer = timers.find((t) => t.id === log.timerId);
        const timerName = timer ? timer.name : '削除されたタイマー';
        // 複数デバイス対応前のログは deviceId を持たないので、タイマーのデバイスを表示する
        const deviceName = log.deviceId
          ? formatDeviceNames([log.deviceId], devices) || '不明なデバイス'
          : timer
            ? formatDeviceNames(timer.deviceIds, devices) || '不明なデバイス'
            : '';

        const isSuccess = log.status === 'success';

        return (
          <div
            key={log.id}
            className={`px-3 py-2 rounded-lg border ${
              isSuccess ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 text-[11px] leading-none px-1.5 py-1 rounded ${
                  isSuccess ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                }`}
              >
                {isSuccess ? '成功' : '失敗'}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium">
                {timerName}
                {deviceName && ` - ${deviceName}`}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{formatDate(log.executedAt)}</span>
              <span className="shrink-0">{log.triggerType === 'schedule' ? 'スケジュール' : '手動'}</span>
            </div>
            {log.errorMessage && (
              <div className="mt-1 text-xs text-red-400 break-all line-clamp-2">{log.errorMessage}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
