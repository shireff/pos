/**
 * Barcode value object with checksum validation for EAN-13 and Code128.
 */
export class Barcode {
  public readonly value: string;
  public readonly format: 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'QR' | 'INTERNAL';

  private constructor(value: string, format: Barcode['format']) {
    this.value = value;
    this.format = format;
  }

  public static ean13(value: string): Barcode {
    if (!/^\d{13}$/.test(value)) throw new Error(`Invalid EAN-13: "${value}"`);
    if (!Barcode.validateEanChecksum(value)) throw new Error(`EAN-13 checksum failed: "${value}"`);
    return new Barcode(value, 'EAN13');
  }

  public static code128(value: string): Barcode {
    if (!value || value.length < 1) throw new Error('CODE128 barcode cannot be empty');
    if (!/^[\x20-\x7E]+$/.test(value)) {
      throw new Error('CODE128 barcode contains invalid characters');
    }
    return new Barcode(value, 'CODE128');
  }

  public static internal(value: string): Barcode {
    if (!value || value.length < 4) throw new Error('Internal barcode too short');
    return new Barcode(value, 'INTERNAL');
  }

  private static validateEanChecksum(ean: string): boolean {
    const digits = ean.split('').map(Number);
    const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }

  public equals(other: Barcode): boolean {
    return this.value === other.value && this.format === other.format;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * ConversionFactor: ratio from a derived unit to the base unit.
 * e.g. 1 carton = 12 pieces → factor = 12
 */
export class ConversionFactor {
  public readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  public static of(value: number): ConversionFactor {
    if (value <= 0) throw new Error(`ConversionFactor must be positive, got ${value}`);
    return new ConversionFactor(value);
  }

  /** Convert a quantity in the derived unit to the base unit. */
  public toBase(derivedQty: number): number {
    return Math.round(derivedQty * this.value);
  }

  /** Convert a quantity in the base unit to the derived unit. */
  public fromBase(baseQty: number): number {
    return baseQty / this.value;
  }
}

/**
 * ProductAttributes: flexible JSON-based variant attributes (size, color, storage, etc.)
 */
export type AttributeMap = Record<string, string>;

export class ProductAttributes {
  private readonly attrs: Readonly<AttributeMap>;

  private constructor(attrs: AttributeMap) {
    this.attrs = Object.freeze({ ...attrs });
  }

  public static of(attrs: AttributeMap): ProductAttributes {
    return new ProductAttributes(attrs);
  }

  public static empty(): ProductAttributes {
    return new ProductAttributes({});
  }

  public get(key: string): string | undefined {
    return this.attrs[key];
  }

  public toJSON(): AttributeMap {
    return { ...this.attrs };
  }

  public equals(other: ProductAttributes): boolean {
    return JSON.stringify(this.attrs) === JSON.stringify(other.attrs);
  }
}
