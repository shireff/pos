import { NextRequest, NextResponse } from 'next/server';
import { RegisterDevice } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../lib/errors';
import { RegisterDeviceSchema } from '@packages/shared-kernel';
import { Device } from '@packages/domain-identity';

class InMemoryDeviceRepository {
  private devices = new Map<string, Device>();

  public async findByFingerprint(fingerprint: string, companyId: string): Promise<Device | null> {
    for (const device of this.devices.values()) {
      if (device.deviceFingerprint === fingerprint && device.companyId === companyId) {
        return device;
      }
    }
    return null;
  }

  public async findById(id: string): Promise<Device | null> {
    return this.devices.get(id) ?? null;
  }

  public async findByCompany(companyId: string): Promise<Device[]> {
    return Array.from(this.devices.values()).filter((device) => device.companyId === companyId);
  }

  public async save(device: Device): Promise<void> {
    this.devices.set(device.id, device);
  }
}

const deviceRepo = new InMemoryDeviceRepository();
const useCase = new RegisterDevice(deviceRepo);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = RegisterDeviceSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute({
      companyId: body.companyId || 'company-demo',
      deviceType: parsed.data.deviceType,
      deviceFingerprint: parsed.data.deviceFingerprint,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          device: {
            id: result.device.id,
            deviceFingerprint: result.device.deviceFingerprint,
            deviceType: result.device.deviceType,
            registeredAt: result.device.registeredAt,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
