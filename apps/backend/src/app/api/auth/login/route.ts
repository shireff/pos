import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUser } from '@packages/application-identity';
import { handleApiError, ValidationError, UnauthorizedError } from '../../../../lib/errors';
import { JwtTokenIssuer } from '../../../../lib/token';
import { ScryptPasswordHasher } from '../../../../lib/password';
import { User, Device } from '@packages/domain-identity';
import { getMongoDb } from '../../../../lib/cloud-db';

// Our collections use string _ids, not ObjectIds.
// Explicitly typing _id as string prevents MongoDB's InferIdType from defaulting to ObjectId.
interface Doc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _id: string;
}

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : new Date().toISOString();
}

// ─── MongoDB User Repository ──────────────────────────────────────────────────

class MongoUserRepository {
  private mapDoc(doc: Doc): User {
    return User.reconstitute({
      id: String(doc._id),
      companyId: String(doc.company_id),
      name: String(doc.name ?? ''),
      phone: String(doc.phone ?? ''),
      email: String(doc.email ?? ''),
      passwordHash: String(doc.password_hash ?? ''),
      offlinePinHash: doc.offline_pin_hash ? String(doc.offline_pin_hash) : null,
      isActive: Boolean(doc.is_active ?? true),
      defaultBranchId: doc.default_branch_id ? String(doc.default_branch_id) : null,
      isDeleted: Boolean(doc.is_deleted ?? false),
      createdAt: toIso(doc.created_at),
      updatedAt: toIso(doc.updated_at),
    });
  }

  public async findByEmail(email: string, companyId: string): Promise<User | null> {
    const db = await getMongoDb();
    const doc = await db.collection<Doc>('users').findOne({ email, company_id: companyId, is_deleted: { $ne: true } });
    return doc ? this.mapDoc(doc) : null;
  }

  public async findById(id: string, companyId: string): Promise<User | null> {
    const db = await getMongoDb();
    const doc = await db.collection<Doc>('users').findOne({ _id: id, company_id: companyId, is_deleted: { $ne: true } });
    return doc ? this.mapDoc(doc) : null;
  }

  public async findByPhone(phone: string, companyId: string): Promise<User | null> {
    const db = await getMongoDb();
    const doc = await db.collection<Doc>('users').findOne({ phone, company_id: companyId, is_deleted: { $ne: true } });
    return doc ? this.mapDoc(doc) : null;
  }

  public async save(user: User): Promise<void> {
    const db = await getMongoDb();
    await db.collection<Doc>('users').updateOne(
      { _id: user.id },
      { $set: { company_id: user.companyId, name: user.name, phone: user.phone, email: user.email, password_hash: user.passwordHash, offline_pin_hash: user.offlinePinHash, is_active: user.isActive, default_branch_id: user.defaultBranchId, is_deleted: user.isDeleted, updated_at: new Date(user.updatedAt) } },
      { upsert: true },
    );
  }

  public async findAll(companyId: string): Promise<User[]> {
    const db = await getMongoDb();
    const docs = await db.collection<Doc>('users').find({ company_id: companyId, is_deleted: { $ne: true } }).toArray();
    return docs.map((doc) => this.mapDoc(doc));
  }
}

// ─── MongoDB Device Repository ────────────────────────────────────────────────

class MongoDeviceRepository {
  private mapDoc(doc: Doc): Device {
    return Device.reconstitute({
      id: String(doc._id),
      companyId: String(doc.company_id),
      deviceType: doc.device_type as 'desktop' | 'android',
      deviceFingerprint: String(doc.device_fingerprint),
      registeredAt: toIso(doc.registered_at),
      lastSeenAt: toIso(doc.last_seen_at),
      isRevoked: Boolean(doc.is_revoked ?? false),
    });
  }

  public async findByFingerprint(fingerprint: string, companyId: string): Promise<Device | null> {
    const db = await getMongoDb();
    const doc = await db.collection<Doc>('devices').findOne({ device_fingerprint: fingerprint, company_id: companyId, is_revoked: { $ne: true } });
    return doc ? this.mapDoc(doc) : null;
  }

  public async findById(id: string): Promise<Device | null> {
    const db = await getMongoDb();
    const doc = await db.collection<Doc>('devices').findOne({ _id: id });
    return doc ? this.mapDoc(doc) : null;
  }

  public async findByCompany(companyId: string): Promise<Device[]> {
    const db = await getMongoDb();
    const docs = await db.collection<Doc>('devices').find({ company_id: companyId }).toArray();
    return docs.map((doc) => this.mapDoc(doc));
  }

  public async save(device: Device): Promise<void> {
    const db = await getMongoDb();
    await db.collection<Doc>('devices').updateOne(
      { _id: device.id },
      {
        $set: { company_id: device.companyId, device_type: device.deviceType, device_fingerprint: device.deviceFingerprint, registered_at: new Date(device.registeredAt), last_seen_at: new Date(device.lastSeenAt), is_revoked: device.isRevoked },
        $setOnInsert: { _id: device.id },
      },
      { upsert: true },
    );
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      email?: string;
      password?: string;
      companyId?: string;
      deviceFingerprint?: string;
      deviceType?: 'desktop' | 'android';
    };

    const { email, password, companyId, deviceFingerprint, deviceType } = body;

    if (!email || !password || !companyId || !deviceFingerprint || !deviceType) {
      throw new ValidationError('email, password, companyId, deviceFingerprint, and deviceType are required');
    }

    const result = await new AuthenticateUser(
      new MongoUserRepository(),
      new MongoDeviceRepository(),
      new ScryptPasswordHasher(),
      new JwtTokenIssuer(),
    ).execute({ email, password, companyId, deviceFingerprint, deviceType });

    // ── Resolve permissions from DB ───────────────────────────────────────────
    const db = await getMongoDb();

    const branchRoleRows = await db.collection<Doc>('user_branch_roles').find({ user_id: result.user.id }).toArray();
    const roleIds = [...new Set(branchRoleRows.map((r) => String(r.role_id)))];
    let permissionCodes: string[] = [];

    if (roleIds.length > 0) {
      const roleDocs = await db.collection<Doc>('roles').find({ _id: { $in: roleIds }, company_id: companyId, is_deleted: { $ne: true } }).toArray();
      const permissionIds = [...new Set(roleDocs.flatMap((r) => (Array.isArray(r.permission_ids) ? (r.permission_ids as string[]) : [])))];

      if (permissionIds.length > 0) {
        const permDocs = await db.collection<Doc>('permissions').find({ _id: { $in: permissionIds }, company_id: companyId, is_deleted: { $ne: true } }).toArray();
        permissionCodes = permDocs.map((p) => String(p.code));
      }
    }

    // ── Issue JWT with resolved permissions ───────────────────────────────────
    const accessToken = new JwtTokenIssuer().issueAccessToken({
      userId: result.user.id,
      companyId: result.user.companyId,
      branchRoles: permissionCodes,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken: result.refreshToken,
          user: { id: result.user.id, companyId: result.user.companyId, name: result.user.name, email: result.user.email },
          device: { id: result.device.id, deviceFingerprint: result.device.deviceFingerprint, deviceType: result.device.deviceType },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return handleApiError(new UnauthorizedError('Invalid credentials'), request);
    }
    return handleApiError(error, request);
  }
}
