import { z } from 'zod';

export const AiAssistantQuerySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  branchId: z.string().uuid().optional().nullable(),
});

export const AiInsightFeedbackSchema = z.object({
  action: z.enum(['accept', 'reject', 'modify']),
  modifiedValue: z.string().optional().nullable(),
});

export const AiOcrSchema = z.object({
  fileReference: z.string().min(1, 'File reference is required'),
});

export const AiInsightListQuerySchema = z.object({
  type: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});
