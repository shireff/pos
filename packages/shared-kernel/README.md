# @packages/shared-kernel

This package contains components and value objects shared across all bounded contexts, enforce domains consistency.

## Exported Value Objects & Types

### 1. `Money`

Immutable value object handling money values in EGP (Egypt Pounds) minor units (piasters). Prevents floating-point precision drifts.

- API:
  - `Money.fromPiasters(val: number): Money`
  - `Money.fromEgp(val: number): Money`
  - `Money.ZERO: Money`
  - `add(other: Money): Money`
  - `subtract(other: Money): Money`
  - `multiply(factor: number): Money`
  - `format(): string` (returns e.g. "100.00 EGP")
  - Rejects negative minor units unless explicitly permitted.

### 2. `DateTime`

Wraps a UTC timestamp and provides formatting and manipulation. Forces Cairo timezone ('Africa/Cairo') rendering.

- API:
  - `DateTime.now(): DateTime`
  - `DateTime.fromIso(iso: string): DateTime`
  - `toCairoString(): string`
  - `toIso(): string`

### 3. `Identifier`

Generates UUIDv7 client-side, enabling chronological ordering.

- API:
  - `Identifier.generate(): string`
  - `Identifier.isValid(id: string): boolean`

### 4. `Result<T, E>`

Monadic wrapper for success/failure representation, avoiding throws for expected flows.

- API:
  - `Result.ok<T, E>(value: T): Result<T, E>`
  - `Result.fail<T, E>(error: E): Result<T, E>`
  - `isOk(): boolean`
  - `isFail(): boolean`
  - `map<U>(fn: (val: T) => U): Result<U, E>`
  - `flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E>`
  - `getOrThrow(): T`

### 5. `DomainEventBase`

Base structure for all domain events.

- Fields: `eventId`, `occurredAt`, `aggregateId`, `aggregateType`.

### 6. `HybridLogicalClock` (HLC)

Logical counter + wall-clock timestamp synchronization mechanism across offline clients.

- API:
  - `HybridLogicalClock.now(): HybridLogicalClock`
  - `advance(): HybridLogicalClock`
  - `update(incoming: HybridLogicalClock): HybridLogicalClock`
  - `toString(): string`
  - `static parse(str: string): HybridLogicalClock`
