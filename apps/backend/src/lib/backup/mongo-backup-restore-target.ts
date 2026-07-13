import { Db } from 'mongodb';
import { BackupCollectionSnapshot, RestoreTarget } from '@packages/infrastructure-backup';

/**
 * MongoBackupRestoreTarget — applies a decrypted snapshot back to the datastore.
 * For each collection it replaces the company's documents (delete + insert),
 * giving a clean point-in-time restore. System collections are never touched.
 */
export class MongoBackupRestoreTarget implements RestoreTarget {
  public constructor(private readonly db: Db) {}

  public async restoreCollections(
    companyId: string,
    collections: BackupCollectionSnapshot[],
  ): Promise<{ restoredCollections: number; restoredRows: number }> {
    let restoredCollections = 0;
    let restoredRows = 0;

    for (const { name, documents } of collections) {
      const coll = this.db.collection(name);
      await coll.deleteMany({ company_id: companyId });
      if (documents.length > 0) {
        await coll.insertMany(documents, { ordered: false });
      }
      restoredCollections += 1;
      restoredRows += documents.length;
    }

    return { restoredCollections, restoredRows };
  }
}
