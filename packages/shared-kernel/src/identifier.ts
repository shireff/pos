import { uuidv7 } from 'uuidv7';

/**
 * Identifier value object handling client-side UUIDv7 generation.
 * UUIDv7 generates timestamp-ordered globally unique identifiers.
 */
export class Identifier {
  public static generate(): string {
    return uuidv7();
  }

  public static isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
