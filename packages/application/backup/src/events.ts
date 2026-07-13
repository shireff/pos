import { DomainEventBase } from '@packages/shared-kernel';

/**
 * RestoreCompletedEvent — emitted after a successful restore so downstream
 * workers (e.g. sync re-pull, notifications) can react.
 */
export class RestoreCompletedEvent extends DomainEventBase {
  public readonly backupId: string;
  public readonly companyId: string;
  public readonly restoredCollections: number;
  public readonly restoredRows: number;

  public constructor(params: {
    backupId: string;
    companyId: string;
    restoredCollections: number;
    restoredRows: number;
  }) {
    super(params.backupId, 'Backup');
    this.backupId = params.backupId;
    this.companyId = params.companyId;
    this.restoredCollections = params.restoredCollections;
    this.restoredRows = params.restoredRows;
  }
}
