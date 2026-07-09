import { NextRequest, NextResponse } from 'next/server';
import { RegisterDevice } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../lib/errors';
import { RegisterDeviceSchema } from '@packages/shared-kernel';
import { Device } from '@packages/domain-identity';
import { getMongoDb } from '../../../../lib/cloud-db';

class MongoDeviceRepository {
  public async findByFingerprint(fingerprint: string, companyId: string): Promise<Device | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection<any>('devices')
      .findOne({ device_fingerprint: fingerprint, company_id: companyId });
    if (!doc) return null;
    return Device.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      deviceType: doc.device_type as 'desktop' | 'android',
      deviceFingerprint: doc.device_fingerprint,
      registeredAt: doc.registered_at.toISOString(),
      lastSeenAt: doc.last_seen_at.toISOString(),
      isRevoked: doc.is_revoked,
    });
  }

  public async findById(id: string): Promise<Device | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('devices').findOne({ _id: id });
    if (!doc) return null;
    return Device.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      deviceType: doc.device_type as 'desktop' | 'android',
      deviceFingerprint: doc.device_fingerprint,
      registeredAt: doc.registered_at.toISOString(),
      lastSeenAt: doc.last_seen_at.toISOString(),
      isRevoked: doc.is_revoked,
    });
  }

  public async findByCompany(companyId: string): Promise<Device[]> {
    const db = await getMongoDb();
    const docs = await db.collection<any>('devices').find({ company_id: companyId }).toArray();
    return docs.map((doc) =>
      Device.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        deviceType: doc.device_type as 'desktop' | 'android',
        deviceFingerprint: doc.device_fingerprint,
        registeredAt: doc.registered_at.toISOString(),
        lastSeenAt: doc.last_seen_at.toISOString(),
        isRevoked: doc.is_revoked,
      }),
    );
  }

  public async save(device: Device): Promise<void> {
    const db = await getMongoDb();
    const snap = device as any;
    await db.collection<any>('devices').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          device_type: snap.deviceType,
          device_fingerprint: snap.deviceFingerprint,
          registered_at: new Date(snap.registeredAt),
          last_seen_at: new Date(snap.lastSeenAt),
          is_revoked: snap.isRevoked,
        },
        $setOnInsert: { _id: snap.id },
      },
      { upsert: true },
    );
  }
}

const deviceRepo = new MongoDeviceRepository();
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
