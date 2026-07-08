import { describe, it, expect, vi } from 'vitest';
import { RevokeDevice } from './revoke-device';
import { Device } from '@packages/domain-identity';
import type { DeviceRepository } from '../ports';

describe('RevokeDevice', () => {
  it('revokes an existing device', async () => {
    const existing = Device.register({
      companyId: 'company-1',
      deviceType: 'desktop',
      deviceFingerprint: 'fp-4',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    const save = vi.fn().mockResolvedValue(undefined);
    const devicesRepo = {
      findById: vi.fn().mockResolvedValue(existing),
      findByFingerprint: vi.fn().mockResolvedValue(null),
      findByCompany: vi.fn().mockResolvedValue([]),
      save,
    };

    const useCase = new RevokeDevice(devicesRepo as DeviceRepository);
    const result = await useCase.execute({ deviceId: existing.id });

    expect(result.device.isRevoked).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
