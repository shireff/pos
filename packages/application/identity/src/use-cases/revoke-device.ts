import { Device } from '@packages/domain-identity';
import type { DeviceRepository } from '../ports';

export interface RevokeDeviceInput {
  deviceId: string;
}

export interface RevokeDeviceOutput {
  device: Device;
}

export class RevokeDevice {
  public constructor(private readonly devices: DeviceRepository) {}

  public async execute(input: RevokeDeviceInput): Promise<RevokeDeviceOutput> {
    const device = await this.devices.findById(input.deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    device.revoke();
    await this.devices.save(device);
    return { device };
  }
}
