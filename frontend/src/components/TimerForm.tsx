'use client';
import { useState } from 'react';
import { client } from '@/lib/client';
import type { SwitchBotInfraredRemote } from '@/types';

export function TimerForm({ devices, onSave, onCancel }: { devices: SwitchBotInfraredRemote[], onSave: () => void, onCancel: () => void }) {
  const [name, setName] = useState('アラーム');
  const [time, setTime] = useState('07:00');
  const [weekdays, setWeekdays] = useState<string[]>([]); // 月-金
  const [deviceId, setDeviceId] = useState(devices[0]?.deviceId || '');
  const [isSelectingDevice, setIsSelectingDevice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) {
        alert('デバイスを選択してください');
        return;
    }
    
    const res = await client.api.timers.$post({
        json: {
            name,
            time,
            weekdays: weekdays.join(','),
            deviceId,
            isActive: true
        }
    });

    if (res.ok) {
        onSave();
    } else {
        alert('保存に失敗しました');
    }
  };

  const toggleDay = (day: string) => {
    if (weekdays.includes(day)) {
        setWeekdays(weekdays.filter(d => d !== day));
    } else {
        setWeekdays([...weekdays, day]);
    }
  };

  const days = [
    { val: '0', label: '日曜日' },
    { val: '1', label: '月曜日' },
    { val: '2', label: '火曜日' },
    { val: '3', label: '水曜日' },
    { val: '4', label: '木曜日' },
    { val: '5', label: '金曜日' },
    { val: '6', label: '土曜日' },
  ];

  if (isSelectingDevice) {
    return (
        <div className="flex flex-col h-full bg-[#1C1C1E] text-white sm:rounded-xl sm:h-auto sm:max-w-md sm:w-full">
            <div className="flex items-center px-4 py-4 bg-[#1C1C1E] sm:bg-transparent shrink-0 border-b border-[#38383A]">
                <button onClick={() => setIsSelectingDevice(false)} className="text-[#FF9F0A] flex items-center gap-1 text-base">
                    <span className="text-xl">‹</span> 戻る
                </button>
                <h2 className="font-bold text-base mx-auto pr-16">デバイスを選択</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-[#2C2C2E] rounded-lg overflow-hidden space-y-px">
                    {devices.map(d => (
                        <button
                            key={d.deviceId}
                            onClick={() => { setDeviceId(d.deviceId); setIsSelectingDevice(false); }}
                            className="w-full flex justify-between items-center p-4 bg-[#2C2C2E] active:bg-[#3A3A3C] border-b border-[#38383A] last:border-none"
                        >
                            <span className="text-base">{d.deviceName}</span>
                            {d.deviceId === deviceId && <span className="text-[#FF9F0A] font-bold">✓</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1C1C1E] text-white sm:rounded-xl sm:h-auto sm:max-w-md sm:w-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-[#1C1C1E] sm:bg-transparent shrink-0">
        <button onClick={onCancel} className="text-[#FF9F0A] text-base">キャンセル</button>
        <h2 className="font-bold text-base">アラームを追加</h2>
        <button onClick={handleSubmit} className="text-[#FF9F0A] font-bold text-base">保存</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Time Picker Area */}
        <div className="flex justify-center py-8">
            <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="bg-transparent text-6xl font-light text-center focus:outline-none w-full"
            />
        </div>

        {/* Settings Cells */}
        <div className="space-y-4">
            <div className="bg-[#2C2C2E] rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-[#38383A]">
                    <span className="text-base">ラベル</span>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="bg-transparent text-right text-[#8E8E93] focus:outline-none"
                        placeholder="アラーム"
                    />
                </div>
                <button 
                    onClick={() => setIsSelectingDevice(true)}
                    className="w-full flex justify-between items-center p-3 active:bg-[#3A3A3C] transition-colors"
                >
                    <span className="text-base">デバイス</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[#8E8E93] text-base">
                            {devices.find(d => d.deviceId === deviceId)?.deviceName || '選択してください'}
                        </span>
                        <span className="text-[#5A5A5E] text-lg">›</span>
                    </div>
                </button>
            </div>

            <div className="bg-[#2C2C2E] rounded-lg overflow-hidden p-2">
                <div className="mb-2 px-2 text-sm text-[#8E8E93]">繰り返し</div>
                <div className="flex justify-between px-1">
                    {days.map(d => (
                        <button
                            key={d.val}
                            type="button"
                            onClick={() => toggleDay(d.val)}
                            className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                                weekdays.includes(d.val) ? 'bg-[#FF9F0A] text-black' : 'bg-[#3A3A3C] text-[#8E8E93]'
                            }`}
                        >
                            {d.label[0]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
