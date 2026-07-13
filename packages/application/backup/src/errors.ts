/**
 * Structured backup errors. Carriers of a machine-readable `code` and an HTTP
 * `statusCode`. The API layer (backend) maps `code` → localized message via
 * its i18n module, keeping user-facing strings out of the application layer.
 */
export class BackupError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode = 422) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class BackupNotFoundError extends BackupError {
  public constructor(id: string) {
    super('BACKUP_NOT_FOUND', `Backup not found: ${id}`, 404);
  }
}

export class BackupIntegrityError extends BackupError {
  public constructor() {
    super('BACKUP_INTEGRITY_CHECK_FAILED', 'Backup integrity check failed', 422);
  }
}

export class BackupDecryptError extends BackupError {
  public constructor() {
    super('BACKUP_DECRYPT_FAILED', 'Backup could not be decrypted', 422);
  }
}

export class RestoreRequiresConfirmationError extends BackupError {
  public constructor() {
    super('RESTORE_REQUIRES_CONFIRMATION', 'Restore requires confirmation text "RESTORE"', 422);
  }
}
