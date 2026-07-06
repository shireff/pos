import { DomainEventBase } from '@packages/shared-kernel';

// ─── Permission ──────────────────────────────────────────────────────────────

/** Structured permission code in `module.action` format (e.g. "sales.create"). */
export class PermissionCode {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static of(module: string, action: string): PermissionCode {
    if (!module || !action) throw new Error('PermissionCode: module and action are required');
    return new PermissionCode(`${module}.${action}`);
  }

  public static fromString(code: string): PermissionCode {
    if (!code.includes('.')) throw new Error(`PermissionCode: invalid format "${code}"`);
    return new PermissionCode(code);
  }

  public equals(other: PermissionCode): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

// ─── ShiftWindow ─────────────────────────────────────────────────────────────

/** Working-hours window (HH:mm strings, 24h). */
export interface ShiftWindowProps {
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "20:00"
  daysOfWeek: number[]; // 0 = Sunday … 6 = Saturday
}

export class ShiftWindow {
  public readonly openTime: string;
  public readonly closeTime: string;
  public readonly daysOfWeek: readonly number[];

  private constructor(props: ShiftWindowProps) {
    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.daysOfWeek = Object.freeze([...props.daysOfWeek]);
  }

  public static create(props: ShiftWindowProps): ShiftWindow {
    if (props.daysOfWeek.some((d) => d < 0 || d > 6))
      throw new Error('ShiftWindow: daysOfWeek must be 0–6');
    return new ShiftWindow(props);
  }

  /** Returns true if the given UTC date falls within this shift window (branch-local evaluation expected by caller). */
  public isWithin(date: Date): boolean {
    const day = date.getDay();
    if (!this.daysOfWeek.includes(day)) return false;
    const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return hhmm >= this.openTime && hhmm < this.closeTime;
  }
}

// ─── DeviceFingerprint ───────────────────────────────────────────────────────

export class DeviceFingerprint {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static of(value: string): DeviceFingerprint {
    if (!value || value.trim().length < 8) throw new Error('DeviceFingerprint: value too short');
    return new DeviceFingerprint(value.trim());
  }

  public equals(other: DeviceFingerprint): boolean {
    return this.value === other.value;
  }
}

// ─── Re-export base for barrel consumers ─────────────────────────────────────
export { DomainEventBase };
