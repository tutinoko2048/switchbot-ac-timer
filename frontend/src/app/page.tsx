'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';
import { TimerForm } from '@/components/TimerForm';
import { TimerList } from '@/components/TimerList';
import { LogList } from '@/components/LogList';
import type { Timer, SwitchBotInfraredRemote, SwitchBotResponse, GetDevicesBody, Log } from '@/types';

export default function Home() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [devices, setDevices] = useState<SwitchBotInfraredRemote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState('');
  const [editingTimer, setEditingTimer] = useState<Timer | undefined>(undefined);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const timersRes = await client.api.timers.$get();
      const devicesRes = await client.api.devices.$get();
      const logsRes = await client.api.logs.$get();

      if (timersRes.ok) {
        const data = await timersRes.json();
        setTimers(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }
      if (devicesRes.ok) {
        const data = await devicesRes.json();
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
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-gray-900 sm:border-none">
          <button onClick={() => setIsEditing(!isEditing)} className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors text-lg z-10 p-2 -m-2">
            {isEditing ? '完了' : '編集'}
          </button>
          <h1 className="text-lg font-semibold absolute left-1/2 -translate-x-1/2">アラーム</h1>
          <button
            onClick={handleCreateTimer}
            className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors text-3xl font-light leading-none z-10 p-2 -m-2"
          >
            +
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 px-0 sm:px-4 py-2 relative flex flex-col md:flex-row gap-6">
          <div className="flex-1">
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
          </div>

          {/* Desktop Log Panel */}
          <div className="hidden md:block w-80 border-l border-gray-800 pl-6">
            <h2 className="text-xl font-bold mb-4 text-gray-300">実行ログ</h2>
            <LogList logs={logs} devices={devices} timers={timers} />
          </div>

          {timeAgo && (
            <div className="fixed bottom-2 right-2 text-xs text-gray-600 font-mono pointer-events-none z-0">
              Updated: {timeAgo}
            </div>
          )}
        </div>

        {/* Mobile Log Button */}
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="md:hidden fixed bottom-6 left-6 w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center shadow-lg border border-gray-500 z-20 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-file-text-fill" viewBox="0 0 16 16">
            <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m0 2h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1" />
          </svg>
        </button>

        {/* Mobile Log Modal */}
        {isLogModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsLogModalOpen(false)}
          >
            <div
              className="w-full h-[70vh] bg-[#1C1C1E] rounded-t-[10px] overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#2C2C2E]">
                <h2 className="text-lg font-bold">実行ログ</h2>
                <button onClick={() => setIsLogModalOpen(false)} className="text-gray-400 p-2">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <LogList logs={logs} devices={devices} timers={timers} />
              </div>
            </div>
          </div>
        )}

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
