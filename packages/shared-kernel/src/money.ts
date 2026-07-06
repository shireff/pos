/**
 * Money value object representing monetary values in Egyptian Pounds (EGP).
 * Internally stores values as integer piasters to avoid floating-point drift.
 */
export class Money {
  private readonly piasters: number;

  private constructor(piasters: number, allowNegative: boolean = false) {
    if (!Number.isInteger(piasters)) {
      throw new Error(`Money value must be an integer: ${piasters}`);
    }
    if (piasters < 0 && !allowNegative) {
      throw new Error(`Negative money is not allowed: ${piasters}`);
    }
    this.piasters = piasters;
  }

  public static fromPiasters(piasters: number, allowNegative: boolean = false): Money {
    return new Money(piasters, allowNegative);
  }

  public static fromEgp(egp: number, allowNegative: boolean = false): Money {
    // Round to avoid float conversion issue (e.g. 10.29 * 100 might be 1028.999999)
    const piasters = Math.round(egp * 100);
    return new Money(piasters, allowNegative);
  }

  public static get ZERO(): Money {
    return new Money(0);
  }

  public getPiasters(): number {
    return this.piasters;
  }

  public getEgp(): number {
    return this.piasters / 100;
  }

  public add(other: Money): Money {
    // Standard rule: if one allows negative, we pass it down, or check bounds.
    return new Money(this.piasters + other.piasters, this.piasters + other.piasters < 0);
  }

  public subtract(other: Money): Money {
    const resultPiasters = this.piasters - other.piasters;
    return new Money(resultPiasters, resultPiasters < 0);
  }

  public multiply(factor: number): Money {
    const resultPiasters = Math.round(this.piasters * factor);
    return new Money(resultPiasters, resultPiasters < 0);
  }

  public equals(other: Money): boolean {
    return this.piasters === other.piasters;
  }

  public format(): string {
    const pounds = (this.piasters / 100).toFixed(2);
    return `${pounds} EGP`;
  }
}
