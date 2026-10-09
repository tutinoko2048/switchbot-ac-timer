import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { TimerForm } from '@/components/TimerForm';
import { TimerList } from '@/components/TimerList';
import { LogList } from '@/components/LogList';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { devicesQuery, logsQuery, timersQuery } from '@/lib/queries';
import type { Timer } from '@/types';

// スマホでは下から出るシート、sm 以上では中央のダイアログとして表示する
// 開いた時に先頭のボタンへフォーカスリングが出ないよう、各シートで onOpenAutoFocus を止めている
const sheetClassName =
  'top-auto bottom-0 left-0 translate-x-0 translate-y-0 w-full max-w-none flex flex-col gap-0 p-0 text-base bg-[#1C1C1E] text-white rounded-t-[10px] rounded-b-none ring-0 shadow-2xl overflow-hidden sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-sm:duration-300 max-sm:data-open:zoom-in-100 max-sm:data-closed:zoom-out-100 max-sm:data-open:slide-in-from-bottom max-sm:data-closed:slide-out-to-bottom';

export const Route = createFileRoute('/')({
  component: Home,
});

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Home() {
  const timersResult = useQuery(timersQuery);
  const { data: logs = [] } = useQuery(logsQuery);
  const { data: devices = [] } = useQuery(devicesQuery);
  const timers = timersResult.data ?? [];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | undefined>(undefined);

  const now = useNow(1000);
  const timeAgo = timersResult.dataUpdatedAt
    ? `${Math.max(0, Math.floor((now - timersResult.dataUpdatedAt) / 1000))}秒前`
    : '';

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingTimer(undefined);
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
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors text-lg z-10 p-2 -m-2"
          >
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
            {timersResult.isPending ? (
              <div className="flex justify-center items-center h-64 text-gray-500">読み込み中...</div>
            ) : (
              <TimerList timers={timers} devices={devices} isEditing={isEditing} onEdit={handleEditTimer} />
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            className="bi bi-file-text-fill"
            viewBox="0 0 16 16"
          >
            <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m0 2h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1" />
          </svg>
        </button>

        {/* Mobile Log Modal */}
        <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
          <DialogContent
            showCloseButton={false}
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`${sheetClassName} h-[70vh] md:hidden`}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#2C2C2E]">
              <DialogTitle className="text-lg font-bold leading-normal">実行ログ</DialogTitle>
              <button onClick={() => setIsLogModalOpen(false)} className="text-gray-400 p-2">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <LogList logs={logs} devices={devices} timers={timers} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Form */}
        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingTimer(undefined);
          }}
        >
          <DialogContent
            showCloseButton={false}
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`${sheetClassName} h-[85vh] sm:h-auto sm:max-w-md sm:rounded-xl`}
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
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
