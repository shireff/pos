/**
 * Standard Result type represent Success (Ok) or Failure (Err) values.
 */
export class Result<T, E> {
  private readonly value?: T;
  private readonly error?: E;
  private readonly isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  public static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  public static fail<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isOk(): boolean {
    return this.isSuccess;
  }

  public isFail(): boolean {
    return !this.isSuccess;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error of a successful Result');
    }
    return this.error as E;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value of a failed Result');
    }
    return this.value as T;
  }

  public getOrThrow(): T {
    if (!this.isSuccess) {
      if (this.error instanceof Error) {
        throw this.error;
      }
      throw new Error(String(this.error || 'Result failed without an Error object'));
    }
    return this.value as T;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    if (!this.isSuccess) {
      return Result.fail<U, E>(this.error as E);
    }
    return Result.ok<U, E>(fn(this.value as T));
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    if (!this.isSuccess) {
      return Result.fail<U, E>(this.error as E);
    }
    return fn(this.value as T);
  }
}
