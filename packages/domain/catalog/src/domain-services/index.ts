import { Category } from '../entities';
import { Barcode } from '../value-objects';

/**
 * BarcodeGenerator — generates EAN-13-compatible internal barcodes.
 * Uses a company prefix + sequential counter.
 */
export class BarcodeGenerator {
  /**
   * Generates an EAN-13 barcode from a 12-digit payload and appends the correct check digit.
   * @param payload — 12 numeric characters (company prefix + product number)
   */
  public static generateEan13(payload: string): Barcode {
    if (!/^\d{12}$/.test(payload)) throw new Error('EAN-13 payload must be exactly 12 digits');
    const digits = payload.split('').map(Number);
    const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return Barcode.ean13(`${payload}${checkDigit}`);
  }

  /**
   * Validates an incoming barcode string and returns the correct Barcode value object.
   * Supports EAN-13 (13 digits) and CODE128 (anything else printable).
   */
  public static parse(raw: string): Barcode {
    if (/^\d{13}$/.test(raw)) return Barcode.ean13(raw);
    if (/^\d{8}$/.test(raw)) {
      // EAN-8 — treat as CODE128 for now (no dedicated VO needed at Phase 02 scope)
      return Barcode.code128(raw);
    }
    return Barcode.code128(raw);
  }
}

/**
 * UnitConversionService — converts prices and stock quantities across units of measure.
 */
export class CategoryTreeService {
  public static ensureNoCircularReference(
    parentId: string,
    categoryId: string,
    categories: readonly Category[],
  ): void {
    if (parentId === categoryId) {
      throw new Error('Circular parent reference is not allowed');
    }

    const byId = new Map(categories.map((category) => [category.id, category]));
    let current = byId.get(parentId);
    const seen = new Set<string>();

    while (current) {
      if (seen.has(current.id)) break;
      seen.add(current.id);
      if (current.id === categoryId) {
        throw new Error('Circular parent reference is not allowed');
      }
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  public static archiveSubtree(categories: readonly Category[], rootId: string): void {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const stack = [rootId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      const current = currentId ? byId.get(currentId) : undefined;
      if (!current || current.isDeleted) continue;

      current.archive();
      for (const child of categories.filter((category) => category.parentId === current.id)) {
        stack.push(child.id);
      }
    }
  }
}

export class UnitConversionService {
  /**
   * Converts a price per derived unit to price per base unit.
   * e.g. carton price 12000 piasters ÷ 12 pieces = 1000 piasters per piece
   */
  public static pricePerBase(pricePiastersPerDerived: number, conversionFactor: number): number {
    if (conversionFactor <= 0) throw new Error('conversionFactor must be positive');
    return Math.round(pricePiastersPerDerived / conversionFactor);
  }

  /**
   * Converts base-unit stock quantity to derived-unit quantity.
   * e.g. 36 pieces ÷ 12 = 3 cartons (may be fractional — caller decides whether to floor)
   */
  public static baseQtyToDerived(baseQty: number, conversionFactor: number): number {
    if (conversionFactor <= 0) throw new Error('conversionFactor must be positive');
    return baseQty / conversionFactor;
  }
}
