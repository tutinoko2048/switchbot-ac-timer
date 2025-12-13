'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';
import { TimerForm } from '@/components/TimerForm';
import { TimerList } from '@/components/TimerList';
import type { Timer, SwitchBotInfraredRemote, SwitchBotResponse, GetDevicesBody } from '@/types';

export default function Home() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [devices, setDevices] = useState<SwitchBotInfraredRemote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState('');
  const [editingTimer, setEditingTimer] = useState<Timer | undefined>(undefined);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const timersRes = await client.api.timers.$get();
      const devicesRes = await client.api.devices.$get();

      if (timersRes.ok) {
        const data = await timersRes.json();
        setTimers(data);
      }
      if (devicesRes.ok) {
        const data = (await devicesRes.json()) as unknown as SwitchBotResponse<GetDevicesBody>;
        if (data.body && data.body.infraredRemoteList) {
          // const acs = data.body.infraredRemoteList.filter((d) => d.remoteType === 'Air Conditioner');
          const acs = data.body.infraredRemoteList;
          setDevices(acs);
        } else {
          console.warn('No infrared devices found or API error', data);
        }
      }
      setLastUpdated(new Date());
      setTimeAgo('0秒前');
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated) {
        const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
        setTimeAgo(`${diff}秒前`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingTimer(undefined);
    fetchData();
  };

  const handleEditTimer = (timer: Timer) => {
    setEditingTimer(timer);
    setIsFormOpen(true);
  };

  const handleCreateTimer = () => {
    setEditingTimer(undefined);
    setIsFormOpen(true);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-gray-900 sm:border-none">
          <button onClick={() => setIsEditing(!isEditing)} className="text-[#FF9F0A] text-lg z-10">
            {isEditing ? '完了' : '編集'}
          </button>
          <h1 className="text-lg font-semibold absolute left-1/2 -translate-x-1/2">アラーム</h1>
          <button
            onClick={handleCreateTimer}
            className="text-[#FF9F0A] text-3xl font-light leading-none z-10"
          >
            +
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 px-0 sm:px-4 py-2 relative">
          <h2 className="text-3xl font-bold px-4 mb-4 hidden sm:block">アラーム</h2>
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500">読み込み中...</div>
          ) : (
            <TimerList
              timers={timers}
              devices={devices}
              onChange={fetchData}
              isEditing={isEditing}
              onEdit={handleEditTimer}
            />
          )}
          {timeAgo && (
            <div className="fixed bottom-2 right-2 text-xs text-gray-600 font-mono pointer-events-none z-0">
              Updated: {timeAgo}
            </div>
          )}
        </div>

        {/* Modal Form */}
        {isFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsFormOpen(false);
              setEditingTimer(undefined);
            }}
          >
            <div
              className="w-full h-[85vh] sm:h-auto sm:max-w-md bg-[#1C1C1E] rounded-t-[10px] sm:rounded-xl overflow-hidden shadow-2xl transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <TimerForm
                devices={devices}
                initialData={editingTimer}
                onSave={handleSave}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingTimer(undefined);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
