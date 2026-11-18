import { useState } from 'react';
import { useDeleteTimer, useSaveTimer } from '@/lib/queries';
import {
  AC_FAN_SPEED_LABELS,
  AC_MODE_LABELS,
  AC_TEMPERATURE_MAX,
  AC_TEMPERATURE_MIN,
  DEFAULT_AC_SETTINGS,
} from '@/lib/ac';
import { formatDeviceNames } from '@/lib/devices';
import type { AcSettings, SwitchBotInfraredRemote, Timer } from '@/types';
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

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-[#3A3A3C] text-xl leading-none active:bg-[#48484A] disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );
}

/** 選択肢を横に並べ、選ばれているものを強調する */
function Segmented<T extends string>({
  labels,
  value,
  onChange,
}: {
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex bg-[#1C1C1E] rounded-lg p-0.5 min-w-0">
      {(Object.keys(labels) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === value}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
            key === value ? 'bg-[#636366] text-white' : 'text-[#99999e]'
          }`}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}

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
  const [deviceIds, setDeviceIds] = useState<string[]>(initialData?.deviceIds ?? []);
  // 運転設定を指定しないときも、切り替えたときに戻せるよう値は持っておく
  const [useAcSettings, setUseAcSettings] = useState(Boolean(initialData?.acSettings));
  const [acSettings, setAcSettings] = useState<AcSettings>(initialData?.acSettings ?? DEFAULT_AC_SETTINGS);
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [isSelectingDevice, setIsSelectingDevice] = useState(false);
  const saveTimer = useSaveTimer();
  const deleteTimer = useDeleteTimer();

  // 選択済みなら外し、未選択なら追加する。並び順はデバイス一覧の順にそろえる
  const toggleDevice = (id: string) => {
    setDeviceIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : devices.map((d) => d.deviceId).filter((x) => x === id || prev.includes(x)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceIds.length === 0) {
      toast.error('デバイスを選択してください');
      return;
    }

    const payload = {
      name: name || 'アラーム',
      time,
      deviceIds,
      acSettings: useAcSettings ? acSettings : null,
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
                onClick={() => toggleDevice(d.deviceId)}
                className="w-full flex justify-between items-center p-4 bg-[#2C2C2E] active:bg-[#3A3A3C] border-b border-[#38383A] last:border-none"
              >
                <span className="text-base">{d.deviceName}</span>
                {deviceIds.includes(d.deviceId) && <span className="text-[#FF9F0A] font-bold">✓</span>}
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
                  {formatDeviceNames(deviceIds, devices) || '選択してください'}
                </span>
                <span className="text-[#6b6b70] text-xl font-extrabold shrink-0">›</span>
              </div>
            </button>
          </div>
        </div>
        {/* 運転設定 */}
        <div>
          <div className="bg-[#2C2C2E] rounded-lg overflow-hidden">
            <div
              className={`flex justify-between items-center h-14 px-4 ${useAcSettings ? 'border-b border-[#38383A]' : ''}`}
            >
              <span className="text-base whitespace-nowrap shrink-0">運転設定を指定</span>
              <Switch checked={useAcSettings} onCheckedChange={setUseAcSettings} />
            </div>
            {useAcSettings && (
              <>
                <div className="flex justify-between items-center h-14 px-4 border-b border-[#38383A]">
                  <span className="text-base whitespace-nowrap shrink-0">温度</span>
                  <div className="flex items-center gap-3">
                    <StepButton
                      label="温度を下げる"
                      disabled={acSettings.temperature <= AC_TEMPERATURE_MIN}
                      onClick={() => setAcSettings((s) => ({ ...s, temperature: s.temperature - 1 }))}
                    >
                      −
                    </StepButton>
                    <span className="w-12 text-center text-base tabular-nums">{acSettings.temperature}℃</span>
                    <StepButton
                      label="温度を上げる"
                      disabled={acSettings.temperature >= AC_TEMPERATURE_MAX}
                      onClick={() => setAcSettings((s) => ({ ...s, temperature: s.temperature + 1 }))}
                    >
                      +
                    </StepButton>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4 h-14 px-4 border-b border-[#38383A]">
                  <span className="text-base whitespace-nowrap shrink-0">モード</span>
                  <Segmented
                    labels={AC_MODE_LABELS}
                    value={acSettings.mode}
                    onChange={(mode) => setAcSettings((s) => ({ ...s, mode }))}
                  />
                </div>
                <div className="flex justify-between items-center gap-4 h-14 px-4">
                  <span className="text-base whitespace-nowrap shrink-0">風量</span>
                  <Segmented
                    labels={AC_FAN_SPEED_LABELS}
                    value={acSettings.fanSpeed}
                    onChange={(fanSpeed) => setAcSettings((s) => ({ ...s, fanSpeed }))}
                  />
                </div>
              </>
            )}
          </div>
          <p className="mt-2 px-4 text-xs text-[#99999e]">
            {useAcSettings
              ? 'この設定で電源を入れます。エアコン以外のデバイスでは使えません。'
              : '前回の設定のまま電源を入れます。'}
          </p>
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
