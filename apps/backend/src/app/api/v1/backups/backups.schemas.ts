import { z } from 'zod';
import { t } from '../../../../lib/i18n';

/**
 * RestoreBackupSchema — restore requires the explicit confirmation text
 * "RESTORE" to prevent accidental triggers (UI_UX.md §3 destructive-action
 * pattern). backupId must be a UUIDv7.
 */
export const RestoreBackupSchema = z.object({
  backupId: z.string().uuid(t('validation.invalidUuid', { field: 'backupId' })),
  confirmText: z
    .string()
    .refine((v) => v === 'RESTORE', t('backup.error.confirmationRequired')),
});

/** Body for POST /v1/backups/:id/restore (backupId comes from the path). */
export const RestoreBackupBodySchema = z.object({
  confirmText: z
    .string()
    .refine((v) => v === 'RESTORE', t('backup.error.confirmationRequired')),
});

/** Body for POST /v1/backups (manual trigger). */
export const CreateBackupSchema = z.object({
  type: z.enum(['full', 'incremental', 'auto']).optional(),
  triggeredBy: z.string().optional(),
});
