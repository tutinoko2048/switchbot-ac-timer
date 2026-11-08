import type { SwitchBotInfraredRemote } from '@/types';

/** デバイスIDの一覧を「リビング・寝室」のような表示名にする。一覧にないIDは除く */
export function formatDeviceNames(deviceIds: string[], devices: SwitchBotInfraredRemote[]) {
  return deviceIds
    .map((id) => devices.find((d) => d.deviceId === id)?.deviceName)
    .filter(Boolean)
    .join('・');
}
