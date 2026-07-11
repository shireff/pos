import { z } from 'zod';

export const ResolveConflictSchema = z.object({
  winner: z.enum(['local', 'remote', 'merge']),
  resolvedValue: z.unknown().optional(),
});

export const SyncConflictsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const SyncStatusQuerySchema = z.object({
  deviceId: z.string().min(1).optional(),
});
