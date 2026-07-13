import * as crypto from 'crypto';

export interface IntegrityResult {
  pass: boolean;
  /** Plain-language, user-safe message. Never includes raw stack traces. */
  message: string;
  actualChecksum?: string;
  expectedChecksum?: string;
}

/**
 * IntegrityChecker — verifies backup file integrity via SHA-256.
 *
 * Corruption or tampering is reported with a plain-language message so the UI
 * can surface it without leaking internals or raw exceptions.
 */
export class IntegrityChecker {
  public static computeChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public static verify(data: Buffer, expectedChecksum: string): IntegrityResult {
    const actual = IntegrityChecker.computeChecksum(data);
    if (actual !== expectedChecksum) {
      return {
        pass: false,
        message:
          'فشل التحقق من سلامة النسخة الاحتياطية. قد يكون الملف تالفاً أو تم التلاعب به. ' +
          'يرجى اختيار نقطة استعادة أخرى.',
        actualChecksum: actual,
        expectedChecksum,
      };
    }
    return { pass: true, message: 'تم التحقق من سلامة النسخة الاحتياطية بنجاح.', actualChecksum: actual };
  }
}
