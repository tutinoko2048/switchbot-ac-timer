import { Log, SwitchBotInfraredRemote, Timer } from '@/types';

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
      year: 'numeric',
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
    <div className="space-y-2">
      {logs.map((log) => {
        const timer = timers.find((t) => t.id === log.timerId);
        const device = timer ? devices.find((d) => d.deviceId === timer.deviceId) : null;
        const timerName = timer ? timer.name : '削除されたタイマー';
        const deviceName = device ? device.deviceName : (timer ? '不明なデバイス' : '');

        return (
          <div
            key={log.id}
            className={`p-3 rounded-lg border ${
              log.status === 'success' ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">{formatDate(log.executedAt)}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  log.status === 'success' ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                }`}
              >
                {log.status === 'success' ? '成功' : '失敗'}
              </span>
            </div>
            <div className="font-medium text-sm">{timerName} - {deviceName}</div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                {log.triggerType === 'schedule' ? 'スケジュール' : '手動'}
              </span>
              {log.errorMessage && <span className="text-xs text-red-400">{log.errorMessage}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
