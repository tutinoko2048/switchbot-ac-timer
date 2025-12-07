import { createHmac, randomUUID } from 'crypto';

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

export class SwitchBotClient {
  private token: string;
  private secret: string;
  private baseUrl = 'https://api.switch-bot.com/v1.1';

  constructor(token: string, secret: string) {
    this.token = token;
    this.secret = secret;
  }

  private getHeaders() {
    const t = Date.now().toString();
    const nonce = randomUUID();
    const data = this.token + t + nonce;
    const sign = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64');

    return {
      'Authorization': this.token,
      'sign': sign,
      'nonce': nonce,
      't': t,
      'Content-Type': 'application/json; charset=utf8',
    };
  }

  async getDevices(): Promise<SwitchBotResponse<GetDevicesBody>> {
    const response = await fetch(`${this.baseUrl}/devices`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SwitchBot API Error: ${response.status} ${text}`);
    }
    return response.json();
  }


  async sendDeviceControl(deviceId: string, command: string, parameter: string = 'default', commandType: string = 'command') {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/commands`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        command,
        parameter,
        commandType,
      }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SwitchBot API Error: ${response.status} ${text}`);
    }
    return response.json();
  }
}

export const switchBotClient = new SwitchBotClient(
  process.env.SWITCHBOT_TOKEN || '',
  process.env.SWITCHBOT_SECRET || ''
);
