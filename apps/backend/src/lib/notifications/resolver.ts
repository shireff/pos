import { getMongoDb } from '../cloud-db';
import type { RecipientResolverPort, RecipientSpec } from '@packages/application-notifications';

const ROLE_NAMES: Record<string, string[]> = {
  OWNER: ['Owner'],
  BRANCH_MANAGER: ['Branch Manager', 'Company Administrator', 'Inventory Manager', 'Assistant Manager'],
  APPROVER: ['Owner', 'Company Administrator', 'Branch Manager', 'Purchasing Officer', 'Inventory Manager'],
  COMPANY_ADMINS: ['Owner', 'Company Administrator'],
};

/**
 * Resolves notification recipients by role within a company, using the standard
 * user_branch_roles / roles collections (rbac.ts model).
 */
export class MongoRecipientResolver implements RecipientResolverPort {
  async resolve(companyId: string, spec: RecipientSpec): Promise<string[]> {
    if (spec.kind === 'USER') return [spec.userId];

    const roleNames =
      spec.kind === 'ROLE' ? [spec.role] : ROLE_NAMES[spec.kind] ?? [];

    const db = await getMongoDb();
    const roleDocs = await db
      .collection('roles')
      .find({ company_id: companyId, name: { $in: roleNames }, is_deleted: { $ne: true } })
      .project<{ _id: unknown }>({ _id: 1 })
      .toArray();
    const roleIds = roleDocs.map((r) => r._id);
    if (roleIds.length === 0) return [];

    const filter: Record<string, unknown> = { role_id: { $in: roleIds } };
    if ((spec.kind === 'BRANCH_MANAGER' || spec.kind === 'APPROVER') && spec.branchId) {
      filter.branch_id = spec.branchId;
    }

    const docs = await db.collection('user_branch_roles').find(filter).toArray();
    return Array.from(new Set(docs.map((d) => String((d as Record<string, unknown>).user_id))));
  }
}
