import { Device } from '@packages/domain-identity';
import type { DeviceRepository } from '../ports';

export interface RegisterDeviceInput {
  companyId: string;
  deviceType: 'desktop' | 'android';
  deviceFingerprint: string;
}

export interface RegisterDeviceOutput {
  device: Device;
}

export class RegisterDevice {
  public constructor(private readonly devices: DeviceRepository) {}

  public async execute(input: RegisterDeviceInput): Promise<RegisterDeviceOutput> {
    const existing = await this.devices.findByFingerprint(input.deviceFingerprint, input.companyId);
    if (existing) {
      existing.updateLastSeen(new Date().toISOString());
      await this.devices.save(existing);
      return { device: existing };
    }

    const device = Device.register({
      companyId: input.companyId,
      deviceType: input.deviceType,
      deviceFingerprint: input.deviceFingerprint,
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    await this.devices.save(device);
    return { device };
  }
}
