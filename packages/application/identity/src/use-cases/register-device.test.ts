import { describe, it, expect, vi } from 'vitest';
import { RegisterDevice } from './register-device';
import { Device } from '@packages/domain-identity';
import type { DeviceRepository } from '../ports';

describe('RegisterDevice', () => {
  it('registers a new device and persists it', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const devicesRepo = {
      findByFingerprint: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      findByCompany: vi.fn().mockResolvedValue([]),
      save,
    };

    const useCase = new RegisterDevice(devicesRepo as DeviceRepository);
    const result = await useCase.execute({
      companyId: 'company-1',
      deviceType: 'desktop',
      deviceFingerprint: 'fp-2',
    });

    expect(result.device.deviceFingerprint).toBe('fp-2');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('refreshes an existing device instead of creating a duplicate', async () => {
    const existing = Device.register({
      companyId: 'company-1',
      deviceType: 'android',
      deviceFingerprint: 'fp-3',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    const save = vi.fn().mockResolvedValue(undefined);
    const devicesRepo = {
      findByFingerprint: vi.fn().mockResolvedValue(existing),
      findById: vi.fn().mockResolvedValue(null),
      findByCompany: vi.fn().mockResolvedValue([]),
      save,
    };

    const useCase = new RegisterDevice(devicesRepo as DeviceRepository);
    const result = await useCase.execute({
      companyId: 'company-1',
      deviceType: 'android',
      deviceFingerprint: 'fp-3',
    });

    expect(result.device.id).toBe(existing.id);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
