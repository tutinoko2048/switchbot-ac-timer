export interface Timer {
  id: number;
  name: string;
  time: string;
  weekdays: string;
  deviceId: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SwitchBotDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  enableCloudService: boolean;
  hubDeviceId: string;
}

export interface SwitchBotInfraredRemote {
  deviceId: string;
  deviceName: string;
  remoteType: string;
  hubDeviceId: string;
}

export interface SwitchBotResponse<T> {
  statusCode: number;
  message: string;
  body: T;
}

export interface GetDevicesBody {
  deviceList: SwitchBotDevice[];
  infraredRemoteList: SwitchBotInfraredRemote[];
}

export interface Log {
  id: number;
  executedAt: string | null;
  command: string;
  status: 'success' | 'failure';
  errorMessage: string | null;
  triggerType: 'schedule' | 'manual';
  timerId: number;
}
