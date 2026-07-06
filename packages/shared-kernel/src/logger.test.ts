import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes info log to stdout as JSON', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    logger.info('test message', { requestId: 'abc' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(output.level).toBe('info');
    expect(output.message).toBe('test message');
    expect(output.requestId).toBe('abc');
    expect(output.timestamp).toBeDefined();
  });

  it('writes error log to stderr as JSON', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    logger.error('something failed', { error: 'boom' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = JSON.parse((writeSpy.mock.calls[0][0] as string).trim());
    expect(output.level).toBe('error');
    expect(output.message).toBe('something failed');
  });

  it('suppresses debug logs in production', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    logger.debug('debug message');
    expect(writeSpy).not.toHaveBeenCalled();
    process.env.NODE_ENV = original;
  });
});
