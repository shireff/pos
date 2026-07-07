import { Identifier } from '@packages/shared-kernel';

// ─── Company ─────────────────────────────────────────────────────────────────

export type BusinessType =
  | 'grocery'
  | 'pharmacy'
  | 'mobile'
  | 'electronics'
  | 'clothing'
  | 'cosmetics'
  | 'gifts'
  | 'stationery'
  | 'hardware'
  | 'bakery'
  | 'bookstore'
  | 'other';

/** Input shape for creating or rehydrating a company aggregate. */
export interface CompanyProps {
  id: string;
  name: string;
  businessType: BusinessType;
  defaultCurrency: string; // ISO 4217 e.g. 'EGP'
  defaultLanguage: 'ar' | 'en';
  timezone: string; // IANA e.g. 'Africa/Cairo'
  etaEnabled: boolean;
  logoUrl: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Tenant company aggregate representing the root organization for licensing and access control. */
export class Company {
  public readonly id: string;
  private _name: string;
  private _businessType: BusinessType;
  private _defaultCurrency: string;
  private _defaultLanguage: 'ar' | 'en';
  private _timezone: string;
  private _etaEnabled: boolean;
  private _logoUrl: string | null;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: CompanyProps) {
    this.id = props.id;
    this._name = props.name;
    this._businessType = props.businessType;
    this._defaultCurrency = props.defaultCurrency;
    this._defaultLanguage = props.defaultLanguage;
    this._timezone = props.timezone;
    this._etaEnabled = props.etaEnabled;
    this._logoUrl = props.logoUrl;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<CompanyProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Company {
    const now = new Date().toISOString();
    return new Company({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: CompanyProps): Company {
    return new Company(props);
  }

  public get name(): string {
    return this._name;
  }
  public get businessType(): BusinessType {
    return this._businessType;
  }
  public get defaultCurrency(): string {
    return this._defaultCurrency;
  }
  public get defaultLanguage(): 'ar' | 'en' {
    return this._defaultLanguage;
  }
  public get timezone(): string {
    return this._timezone;
  }
  public get etaEnabled(): boolean {
    return this._etaEnabled;
  }
  public get logoUrl(): string | null {
    return this._logoUrl;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public update(
    fields: Partial<
      Pick<CompanyProps, 'name' | 'defaultCurrency' | 'defaultLanguage' | 'timezone' | 'logoUrl'>
    >,
  ): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.defaultCurrency !== undefined) this._defaultCurrency = fields.defaultCurrency;
    if (fields.defaultLanguage !== undefined) this._defaultLanguage = fields.defaultLanguage;
    if (fields.timezone !== undefined) this._timezone = fields.timezone;
    if (fields.logoUrl !== undefined) this._logoUrl = fields.logoUrl;
    this._updatedAt = new Date().toISOString();
  }

  public enableEta(): void {
    this._etaEnabled = true;
    this._updatedAt = new Date().toISOString();
  }
  public disableEta(): void {
    this._etaEnabled = false;
    this._updatedAt = new Date().toISOString();
  }
  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface WorkingHours {
  openTime: string;
  closeTime: string;
  daysOfWeek: number[];
}

export * from './auth-entities';

/** Input shape for creating or rehydrating a branch aggregate. */
export interface BranchProps {
  id: string;
  companyId: string;
  name: string;
  address: string;
  warehouseId: string | null;
  workingHoursOverride: WorkingHours | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Branch aggregate used to represent operational units under a company. */
export class Branch {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _address: string;
  private _warehouseId: string | null;
  private _workingHoursOverride: WorkingHours | null;
  private _isActive: boolean;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: BranchProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._address = props.address;
    this._warehouseId = props.warehouseId;
    this._workingHoursOverride = props.workingHoursOverride;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<BranchProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Branch {
    const now = new Date().toISOString();
    return new Branch({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: BranchProps): Branch {
    return new Branch(props);
  }

  public get name(): string {
    return this._name;
  }
  public get address(): string {
    return this._address;
  }
  public get warehouseId(): string | null {
    return this._warehouseId;
  }
  public get workingHoursOverride(): WorkingHours | null {
    return this._workingHoursOverride;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public update(
    fields: Partial<Pick<BranchProps, 'name' | 'address' | 'workingHoursOverride'>>,
  ): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.address !== undefined) this._address = fields.address;
    if (fields.workingHoursOverride !== undefined)
      this._workingHoursOverride = fields.workingHoursOverride;
    this._updatedAt = new Date().toISOString();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date().toISOString();
  }
  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }
  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}

// ─── User ────────────────────────────────────────────────────────────────────

/** Input shape for creating or rehydrating a user aggregate. */
export interface UserProps {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  offlinePinHash: string | null;
  isActive: boolean;
  defaultBranchId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** User aggregate that owns authentication state, profile data, and branch defaults. */
export class User {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _phone: string;
  private _email: string;
  private _passwordHash: string;
  private _offlinePinHash: string | null;
  private _isActive: boolean;
  private _defaultBranchId: string | null;
  private _isDeleted: boolean;
  public readonly createdAt: string;
  private _updatedAt: string;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name;
    this._phone = props.phone;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._offlinePinHash = props.offlinePinHash;
    this._isActive = props.isActive;
    this._defaultBranchId = props.defaultBranchId;
    this._isDeleted = props.isDeleted;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    props: Omit<UserProps, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'offlinePinHash'> & {
      offlinePinHash?: string | null;
    },
  ): User {
    const now = new Date().toISOString();
    return new User({
      id: Identifier.generate(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      offlinePinHash: props.offlinePinHash ?? null,
      ...props,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public get name(): string {
    return this._name;
  }
  public get phone(): string {
    return this._phone;
  }
  public get email(): string {
    return this._email;
  }
  public get passwordHash(): string {
    return this._passwordHash;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get defaultBranchId(): string | null {
    return this._defaultBranchId;
  }
  public get isDeleted(): boolean {
    return this._isDeleted;
  }
  public get updatedAt(): string {
    return this._updatedAt;
  }

  public updatePasswordHash(hash: string): void {
    this._passwordHash = hash;
    this._updatedAt = new Date().toISOString();
  }

  public updateProfile(
    fields: Partial<Pick<UserProps, 'name' | 'phone' | 'email' | 'defaultBranchId'>>,
  ): void {
    if (fields.name !== undefined) this._name = fields.name;
    if (fields.phone !== undefined) this._phone = fields.phone;
    if (fields.email !== undefined) this._email = fields.email;
    if (fields.defaultBranchId !== undefined) this._defaultBranchId = fields.defaultBranchId;
    this._updatedAt = new Date().toISOString();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date().toISOString();
  }
  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date().toISOString();
  }
  public archive(): void {
    this._isDeleted = true;
    this._updatedAt = new Date().toISOString();
  }
}
