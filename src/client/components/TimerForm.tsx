import { useState } from 'react';
import { useDeleteTimer, useSaveTimer } from '@/lib/queries';
import type { SwitchBotInfraredRemote, Timer } from '@/types';
import { toast } from 'sonner';
import { DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function TimerForm({
  devices,
  initialData,
  onSave,
  onCancel,
}: {
  devices: SwitchBotInfraredRemote[];
  initialData?: Timer;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [time, setTime] = useState(initialData?.time || '08:00');
  const [weekdays] = useState<string[]>(initialData?.weekdays ? initialData.weekdays.split(',') : []); // 月-金
  const [deviceId, setDeviceId] = useState(initialData?.deviceId || '');
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [isSelectingDevice, setIsSelectingDevice] = useState(false);
  const saveTimer = useSaveTimer();
  const deleteTimer = useDeleteTimer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) {
      toast.error('デバイスを選択してください');
      return;
    }

    const payload = {
      name: name || 'アラーム',
      time,
      weekdays: weekdays.join(','),
      deviceId,
      isActive,
    };

    saveTimer.mutate(
      { id: initialData?.id, input: payload },
      {
        onSuccess: onSave,
        onError: () => toast.error('保存に失敗しました'),
      },
    );
  };

  const handleDelete = () => {
    if (!initialData) return;

    deleteTimer.mutate(initialData.id, {
      onSuccess: onSave,
      onError: () => toast.error('削除に失敗しました'),
    });
  };

  if (isSelectingDevice) {
    return (
      <div className="flex flex-col h-full bg-[#1C1C1E] text-white sm:rounded-xl sm:h-auto sm:max-w-md sm:w-full">
        <div className="flex items-center px-4 py-4 bg-[#1C1C1E] sm:bg-transparent shrink-0 border-b border-[#38383A]">
          <button
            onClick={() => setIsSelectingDevice(false)}
            className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors flex items-center gap-1 text-base"
          >
            <span className="text-xl">‹</span> 戻る
          </button>
          <DialogTitle className="font-bold text-base leading-normal mx-auto pr-16">デバイスを選択</DialogTitle>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-[#2C2C2E] rounded-lg overflow-hidden space-y-px">
            {devices.map((d) => (
              <button
                key={d.deviceId}
                onClick={() => {
                  setDeviceId(d.deviceId);
                  setIsSelectingDevice(false);
                }}
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
      <div className="relative flex justify-between items-center px-4 py-4 bg-[#1C1C1E] sm:bg-transparent shrink-0">
        <button
          onClick={onCancel}
          className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors text-base z-10 p-2 -m-2"
        >
          キャンセル
        </button>
        <DialogTitle className="font-bold text-base leading-normal absolute left-1/2 -translate-x-1/2">
          {initialData ? 'アラームを編集' : 'アラームを追加'}
        </DialogTitle>
        <button
          onClick={handleSubmit}
          className="text-[#FF9F0A] hover:text-[#FFB340] transition-colors font-bold text-base z-10 p-2 -m-2"
        >
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Time Picker Area */}
        <div className="flex justify-center py-8 px-10">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-transparent text-6xl font-light text-center focus:outline-none w-full scheme-dark hover:text-gray-200 transition-colors"
          />
        </div>

        {/* Settings Cells */}
        <div>
          <div className="bg-[#2C2C2E] rounded-lg overflow-hidden">
            <div className="flex justify-between items-center h-14 px-4 border-b border-[#38383A]">
              <span className="text-base whitespace-nowrap shrink-0">ステータス</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex justify-between items-center h-14 px-4 border-b border-[#38383A]">
              <span className="text-base whitespace-nowrap shrink-0">ラベル</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                className="bg-transparent text-right text-[#99999e] focus:outline-none flex-1 min-w-0 ml-4"
                placeholder="アラーム"
              />
            </div>
            <button
              onClick={() => setIsSelectingDevice(true)}
              className="w-full flex justify-between items-center h-14 px-4 active:bg-[#3A3A3C] transition-colors"
            >
              <span className="text-base whitespace-nowrap shrink-0">デバイス</span>
              <div className="flex items-center gap-2 flex-1 justify-end min-w-0 ml-4">
                <span className="text-[#99999e] text-base truncate">
                  {devices.find((d) => d.deviceId === deviceId)?.deviceName || '選択してください'}
                </span>
                <span className="text-[#6b6b70] text-xl font-extrabold shrink-0">›</span>
              </div>
            </button>
          </div>
        </div>
        {initialData && (
          <div className="mt-10">
            <div className="bg-[#252527] rounded-lg overflow-hidden">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-14 text-[#FF4245] text-base active:bg-[#3A3A3C] transition-colors"
                  >
                    タイマーを削除
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>このタイマーを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="ghost" className="text-base text-primary hover:text-primary">
                      キャンセル
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="ghost"
                      className="text-base font-bold text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
