import { describe, it, expect } from 'vitest';
import { Result } from './result';

describe('Result Container', () => {
  it('Ok(value).map(fn) applies fn to value', () => {
    const res = Result.ok<number, string>(10).map((v) => v * 2);
    expect(res.isOk()).toBe(true);
    expect(res.getValue()).toBe(20);
  });

  it('Err(error).map(fn) does not apply fn', () => {
    let called = false;
    const res = Result.fail<number, string>('error').map((v) => {
      called = true;
      return v * 2;
    });
    expect(res.isFail()).toBe(true);
    expect(res.getError()).toBe('error');
    expect(called).toBe(false);
  });

  it('Ok(value).flatMap(fn) chains correctly', () => {
    const res = Result.ok<number, string>(10).flatMap((v) =>
      Result.ok<string, string>(`val: ${v}`),
    );
    expect(res.isOk()).toBe(true);
    expect(res.getValue()).toBe('val: 10');

    const resFailure = Result.ok<number, string>(10).flatMap(() =>
      Result.fail<string, string>('inner error'),
    );
    expect(resFailure.isFail()).toBe(true);
    expect(resFailure.getError()).toBe('inner error');
  });

  it('Err(error).getOrThrow() throws the error', () => {
    const res = Result.fail<number, string>('some error');
    expect(() => res.getOrThrow()).toThrow('some error');

    const resError = Result.fail<number, Error>(new Error('actual error'));
    expect(() => resError.getOrThrow()).toThrow('actual error');
  });

  it('Ok(value).getOrThrow() returns value', () => {
    const res = Result.ok<number, string>(10);
    expect(res.getOrThrow()).toBe(10);
  });
});
