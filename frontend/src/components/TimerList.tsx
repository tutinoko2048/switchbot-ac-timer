'use client';
import { client } from '@/lib/client';
import type { Timer } from '@/types';

export function TimerList({ timers, onChange }: { timers: Timer[], onChange: () => void }) {
  const handleDelete = async (id: number) => {
    if (!confirm('このタイマーを削除しますか？')) return;
    await client.api.timers[':id'].$delete({ param: { id: id.toString() } });
    onChange();
  };

  const handleToggle = async (timer: Timer) => {
    await client.api.timers[':id'].$put({
        param: { id: timer.id.toString() },
        json: {
            name: timer.name,
            time: timer.time,
            weekdays: timer.weekdays,
            deviceId: timer.deviceId,
            isActive: !timer.isActive
        }
    });
    onChange();
  };

  const handleTest = async (deviceId: string) => {
      await client.api.test[':deviceId'].$post({ param: { deviceId } });
      alert('コマンドを送信しました！');
  };

  if (timers.length === 0) return <div className="text-center text-gray-500 mt-10">アラームはありません</div>;

  return (
    <div className="space-y-px bg-gray-900 rounded-lg overflow-hidden">
      {timers.map(timer => (
        <div key={timer.id} className="group relative flex justify-between items-center p-4 bg-[#1C1C1E] hover:bg-[#2C2C2E] transition-colors">
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-light tracking-tight ${timer.isActive ? 'text-white' : 'text-gray-500'}`}>
                        {timer.time}
                    </span>
                    <span className="text-sm text-gray-500 hidden sm:inline-block">
                        {timer.name}
                    </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                    {timer.name !== 'My Timer' && <span className="mr-2 sm:hidden">{timer.name}</span>}
                    {formatWeekdays(timer.weekdays)}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* PCでのみ表示する操作ボタン */}
                <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleTest(timer.deviceId)} className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-full hover:bg-gray-600">テスト</button>
                    <button onClick={() => handleDelete(timer.id)} className="text-xs bg-red-900/50 text-red-400 px-3 py-1.5 rounded-full hover:bg-red-900/80">削除</button>
                </div>

                {/* トグルスイッチ */}
                <button 
                    onClick={() => handleToggle(timer)}
                    className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-300 ease-in-out ${timer.isActive ? 'bg-[#34C759]' : 'bg-[#39393D]'}`}
                >
                    <div className={`bg-white w-[27px] h-[27px] rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${timer.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
            
            {/* スマホ用削除ボタン（長押しやスワイプの代わり） */}
            <button 
                onClick={() => handleDelete(timer.id)}
                className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-red-500 sm:hidden opacity-0"
                aria-label="削除"
            >
                ×
            </button>
        </div>
      ))}
    </div>
  );
}

function formatWeekdays(weekdays: string) {
    const daysMap = ['日', '月', '火', '水', '木', '金', '土'];
    const days = weekdays.split(',').map(d => parseInt(d)).sort();
    
    if (days.length === 7) return '毎日';
    if (days.length === 5 && days.includes(1) && days.includes(5) && !days.includes(0) && !days.includes(6)) return '平日';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return '週末';
    if (days.length === 0) return '一度のみ';
    
    return days.map(d => daysMap[d]).join(' ');
}
