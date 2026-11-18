import type { AcFanSpeed, AcMode, AcSettings } from '@/types';

export const AC_MODE_LABELS: Record<AcMode, string> = {
  auto: '自動',
  cool: '冷房',
  dry: '除湿',
  fan: '送風',
  heat: '暖房',
};

export const AC_FAN_SPEED_LABELS: Record<AcFanSpeed, string> = {
  auto: '自動',
  low: '弱',
  medium: '中',
  high: '強',
};

export const AC_TEMPERATURE_MIN = 16;
export const AC_TEMPERATURE_MAX = 30;

export const DEFAULT_AC_SETTINGS: AcSettings = { temperature: 26, mode: 'cool', fanSpeed: 'auto' };

/** 「冷房 26℃ 風量自動」のような表示にする */
export function formatAcSettings({ temperature, mode, fanSpeed }: AcSettings) {
  return `${AC_MODE_LABELS[mode]} ${temperature}℃ 風量${AC_FAN_SPEED_LABELS[fanSpeed]}`;
}
