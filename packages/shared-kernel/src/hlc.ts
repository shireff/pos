/**
 * Hybrid Logical Clock (HLC) implementation.
 * Combines physical wall-clock time with a logical counter for causal ordering in offline-first systems.
 * Serializes as string format: "timestamp:counter:nodeId"
 */
export class HybridLogicalClock {
  public readonly time: number;
  public readonly logical: number;
  public readonly nodeId: string;

  public constructor(time: number, logical: number, nodeId: string) {
    this.time = time;
    this.logical = logical;
    this.nodeId = nodeId;
  }

  public static generateInitial(nodeId: string): HybridLogicalClock {
    return new HybridLogicalClock(Date.now(), 0, nodeId);
  }

  /**
   * Advances the HLC for a local event.
   */
  public advance(): HybridLogicalClock {
    const physical = Date.now();
    let newTime = this.time;
    let newLogical = this.logical + 1;

    if (physical > this.time) {
      newTime = physical;
      newLogical = 0;
    }

    return new HybridLogicalClock(newTime, newLogical, this.nodeId);
  }

  /**
   * Updates the HLC given an incoming remote HLC value.
   */
  public update(incoming: HybridLogicalClock): HybridLogicalClock {
    const physical = Date.now();
    const maxTime = Math.max(this.time, incoming.time, physical);
    let newLogical = 0;

    if (maxTime === this.time && maxTime === incoming.time) {
      newLogical = Math.max(this.logical, incoming.logical) + 1;
    } else if (maxTime === this.time) {
      newLogical = this.logical + 1;
    } else if (maxTime === incoming.time) {
      newLogical = incoming.logical + 1;
    } else {
      newLogical = 0;
    }

    return new HybridLogicalClock(maxTime, newLogical, this.nodeId);
  }

  /**
   * Compares two HybridLogicalClocks for causality ordering.
   * Returns:
   *  < 0 if this occurred before other.
   *  > 0 if this occurred after other.
   *  0 if concurrent (node IDs may differ).
   */
  public compare(other: HybridLogicalClock): number {
    if (this.time !== other.time) {
      return this.time - other.time;
    }
    if (this.logical !== other.logical) {
      return this.logical - other.logical;
    }
    return this.nodeId.localeCompare(other.nodeId);
  }

  /**
   * Serializes to "time:logical:nodeId" string.
   */
  public toString(): string {
    return `${this.time}:${this.logical}:${this.nodeId}`;
  }

  /**
   * Deserializes from string format "time:logical:nodeId".
   */
  public static parse(str: string): HybridLogicalClock {
    const parts = str.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid HLC string format: ${str}`);
    }
    const time = parseInt(parts[0], 10);
    const logical = parseInt(parts[1], 10);
    const nodeId = parts[2];

    if (isNaN(time) || isNaN(logical) || !nodeId) {
      throw new Error(`Invalid HLC string format: ${str}`);
    }

    return new HybridLogicalClock(time, logical, nodeId);
  }
}
