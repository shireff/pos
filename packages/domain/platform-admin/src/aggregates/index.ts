import { Identifier } from '@packages/shared-kernel';
import { PlatformAdminRole } from '../value-objects';

/**
 * PlatformAdminUser — vendor-side operator account.
 * NOT a row in the tenant `users` table — a completely separate entity
 * with its own authentication realm (Security.md §11.1, Architecture.md §3.1).
 */
/** Input shape for a platform administrator aggregate. */
export interface PlatformAdminUserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: PlatformAdminRole;
  mfaSecret: string | null;
  isMfaEnrolled: boolean;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Platform administrator aggregate that lives outside the tenant identity realm. */
export class PlatformAdminUser {
  public readonly id: string;
  private _name: string;
  private _email: string;
  private _passwordHash: string;
  public readonly role: PlatformAdminRole;
  private _mfaSecret: string | null;
  private _isMfaEnrolled: boolean;
  private _isActive: boolean;
  private _failedLoginAttempts: number;
  private _lockedUntil: string | null;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: PlatformAdminUserProps) {
    this.id = props.id;
    this._name = props.name;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this.role = props.role;
    this._mfaSecret = props.mfaSecret;
    this._isMfaEnrolled = props.isMfaEnrolled;
    this._isActive = props.isActive;
    this._failedLoginAttempts = props.failedLoginAttempts;
    this._lockedUntil = props.lockedUntil;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<
      PlatformAdminUserProps,
      'id' | 'failedLoginAttempts' | 'lockedUntil' | 'createdAt' | 'updatedAt'
    >,
  ): PlatformAdminUser {
    const now = new Date().toISOString();
    return new PlatformAdminUser({
      id: Identifier.generate(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: PlatformAdminUserProps): PlatformAdminUser {
    return new PlatformAdminUser(props);
  }

  public get name(): string {
    return this._name;
  }
  public get email(): string {
    return this._email;
  }
  public get passwordHash(): string {
    return this._passwordHash;
  }
  public get mfaSecret(): string | null {
    return this._mfaSecret;
  }
  public get isMfaEnrolled(): boolean {
    return this._isMfaEnrolled;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }
  public get lockedUntil(): string | null {
    return this._lockedUntil;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public isLockedOut(asOf: Date = new Date()): boolean {
    if (!this._lockedUntil) return false;
    return new Date(this._lockedUntil) > asOf;
  }

  public enrollMfa(secret: string): void {
    this._mfaSecret = secret;
    this._isMfaEnrolled = true;
    this._updatedAt = new Date().toISOString();
  }

  public recordFailedLogin(
    lockoutDurationMs: number = 15 * 60 * 1000,
    maxAttempts: number = 5,
  ): void {
    this._failedLoginAttempts += 1;
    if (this._failedLoginAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockoutDurationMs);
      this._lockedUntil = lockUntil.toISOString();
    }
    this._updatedAt = new Date().toISOString();
  }

  public recordSuccessfulLogin(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = null;
    this._updatedAt = new Date().toISOString();
  }

  public updatePasswordHash(hash: string): void {
    this._passwordHash = hash;
    this._updatedAt = new Date().toISOString();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }
}
