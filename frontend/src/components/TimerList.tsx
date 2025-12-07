'use client';
import { useState } from 'react';
import { client } from '@/lib/client';
import type { Timer, SwitchBotInfraredRemote } from '@/types';

export function TimerList({ timers, devices, onChange, isEditing, onEdit }: { timers: Timer[], devices: SwitchBotInfraredRemote[], onChange: () => void, isEditing: boolean, onEdit: (timer: Timer) => void }) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing);

  if (isEditing !== prevIsEditing) {
    setPrevIsEditing(isEditing);
    if (!isEditing) {
      setDeletingId(null);
    }
  }

  const handleDelete = async (id: number) => {
    // if (!confirm('このタイマーを削除しますか？')) return; // iOS style doesn't confirm with alert, just deletes
    await client.api.timers[':id'].$delete({ param: { id: id.toString() } });
    onChange();
    setDeletingId(null);
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
      {timers.map(timer => {
        const deviceName = devices.find(d => d.deviceId === timer.deviceId)?.deviceName || '不明なデバイス';
        const isDeleting = deletingId === timer.id;

        return (
        <div 
            key={timer.id} 
            className="group relative flex items-center bg-[#1C1C1E] transition-colors overflow-hidden cursor-pointer active:bg-[#2C2C2E]"
            onClick={() => onEdit(timer)}
        >
            
            {/* Left Side: Delete Trigger (Minus icon) */}
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center ${isEditing ? 'w-10 ml-4 opacity-100' : 'w-0 ml-0 opacity-0'}`}
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); setDeletingId(isDeleting ? null : timer.id); }}
                    className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0"
                >
                    <div className={`w-3 h-0.5 bg-white transition-transform duration-300 ${isDeleting ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-4 pr-4 pl-4 flex justify-between items-center min-w-0">
                <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-light tracking-tight ${timer.isActive ? 'text-white' : 'text-gray-500'}`}>
                            {timer.time}
                        </span>
                        <span className="text-sm text-gray-500 hidden sm:inline-block truncate">
                            {timer.name} - {deviceName}
                        </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1 truncate">
                        <span className="mr-2 sm:hidden">{timer.name} - {deviceName}</span>
                        {/* {formatWeekdays(timer.weekdays)} */}
                    </div>
                </div>
                
                <div className={`flex items-center gap-4 transition-transform duration-300 ${isDeleting ? '-translate-x-20' : 'translate-x-0'}`}>
                    {/* PCでのみ表示する操作ボタン (編集中は非表示) */}
                    {!isEditing && (
                        <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleTest(timer.deviceId); }} className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-full hover:bg-gray-600">テスト</button>
                        </div>
                    )}

                    {isEditing ? (
                        <span className="text-[#3A3A3C] text-xl font-bold">›</span>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleToggle(timer); }}
                            className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-300 ease-in-out ${timer.isActive ? 'bg-[#34C759]' : 'bg-[#39393D]'}`}
                        >
                            <div className={`bg-white w-[27px] h-[27px] rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${timer.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Slide-in Delete Button */}
            <div 
                className={`absolute right-0 top-0 bottom-0 bg-red-600 flex items-center justify-center transition-all duration-300 ease-in-out ${isDeleting ? 'w-20' : 'w-0'}`}
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(timer.id); }}
                    className="w-full h-full text-white font-bold whitespace-nowrap"
                >
                    削除
                </button>
            </div>
        </div>
      );})}
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
