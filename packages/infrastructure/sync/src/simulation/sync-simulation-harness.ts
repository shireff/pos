import { SyncEvent, SyncConflict, FieldState, ClassAEvent, ClassBMergeService } from '@packages/domain-sync';
import { HybridLogicalClock } from '@packages/shared-kernel';
import {
  OutboxWriter,
  OutboxDrainer,
  InboxProcessor,
  InMemoryIdempotencyStore,
  BacklogPaginator,
  BacklogSource,
} from '@packages/application-sync';
import {
  OutboxStore,
  InboxStore,
  ReplicaStore,
  ConflictStore,
  SyncTransport,
  TransportKind,
} from '@packages/application-sync';

// ─── In-memory engine stores ──────────────────────────────────────────────────

class InMemoryOutbox implements OutboxStore {
  private events: SyncEvent[] = [];
  private sent = new Set<string>();
  private ack = new Set<string>();
  async append(e: SyncEvent): Promise<void> {
    this.events.push(e);
  }
  async getPending(deviceId: string): Promise<SyncEvent[]> {
    return this.events.filter((e) => e.deviceId === deviceId && !this.sent.has(e.eventId));
  }
  async markSent(id: string): Promise<void> {
    this.sent.add(id);
  }
  async markAcknowledged(id: string): Promise<void> {
    this.ack.add(id);
  }
}

class InMemoryInbox implements InboxStore {
  private events: SyncEvent[] = [];
  private applied = new Set<string>();
  async append(e: SyncEvent): Promise<void> {
    this.events.push(e);
  }
  async getPending(): Promise<SyncEvent[]> {
    return this.events.filter((e) => !this.applied.has(e.eventId));
  }
  async markApplied(id: string): Promise<void> {
    this.applied.add(id);
  }
  async markConflict(_id: string): Promise<void> {
    /* recorded via ConflictStore */
  }
}

class InMemoryConflicts implements ConflictStore {
  private conflicts: SyncConflict[] = [];
  async save(c: SyncConflict): Promise<void> {
    this.conflicts.push(c);
  }
  async findPending(companyId: string): Promise<SyncConflict[]> {
    return this.conflicts.filter((c) => c.companyId === companyId && c.isUnresolved);
  }
  async findById(id: string): Promise<SyncConflict | null> {
    return this.conflicts.find((c) => c.id === id) ?? null;
  }
  all(): readonly SyncConflict[] {
    return this.conflicts;
  }
}

class InMemoryReplica implements ReplicaStore {
  private stock: Record<string, number> = {};
  private docs: Record<string, Record<string, FieldState>> = {};

  async applyClassA(events: ClassAEvent[]): Promise<void> {
    for (const e of events) {
      if (e.appendOnly) continue;
      this.stock[e.entityId] = (this.stock[e.entityId] ?? 0) + e.signedQuantity;
    }
  }

  async getFieldStates(entityType: string, entityId: string): Promise<Record<string, FieldState>> {
    return this.docs[`${entityType}:${entityId}`] ?? {};
  }

  async putFieldStates(
    entityType: string,
    entityId: string,
    states: Record<string, FieldState>,
  ): Promise<void> {
    this.docs[`${entityType}:${entityId}`] = states;
  }

  // ── test/assertion helpers ──
  getStock(entityId: string): number {
    return this.stock[entityId] ?? 0;
  }
  getFieldValue(entityType: string, entityId: string, field: string): unknown {
    return this.docs[`${entityType}:${entityId}`]?.[field]?.value;
  }
  applyResolution(
    entityType: string,
    entityId: string,
    field: string,
    value: unknown,
    hlc: HybridLogicalClock,
  ): void {
    const key = `${entityType}:${entityId}`;
    const doc = this.docs[key] ?? {};
    doc[field] = { value, hlc };
    this.docs[key] = doc;
  }
}

// ─── Simulated network (in-memory transport + partitions + server log) ─────────

class SimulatedTransport implements SyncTransport {
  public readonly kind: TransportKind = 'lan';
  private handlers: ((e: SyncEvent) => void)[] = [];

  public constructor(
    private readonly network: SimulatedNetwork,
    private readonly deviceId: string,
  ) {
    this.network.registerInbound(this.deviceId, (e) => this.handlers.forEach((h) => h(e)));
  }

  public async send(events: SyncEvent[]): Promise<void> {
    await this.network.broadcast(this.deviceId, events);
  }

  public receive(handler: (e: SyncEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  public async close(): Promise<void> {
    this.handlers = [];
  }
}

export class SimulatedNetwork {
  private inbound = new Map<string, (e: SyncEvent) => void>();
  private offline = new Set<string>();
  private pending = new Map<string, SyncEvent[]>();
  /** Global ordered event log (relay/server) used for backlog catch-up. */
  public readonly serverLog: SyncEvent[] = [];

  public registerInbound(deviceId: string, handler: (e: SyncEvent) => void): void {
    this.inbound.set(deviceId, handler);
  }

  public isOffline(deviceId: string): boolean {
    return this.offline.has(deviceId);
  }

  public partition(deviceId: string): void {
    this.offline.add(deviceId);
  }

  public async reconnect(deviceId: string): Promise<void> {
    this.offline.delete(deviceId);
    const buffered = this.pending.get(deviceId) ?? [];
    this.pending.set(deviceId, []);
    for (const e of buffered) this.deliverTo(deviceId, e);
  }

  public async broadcast(fromId: string, events: SyncEvent[]): Promise<void> {
    this.serverLog.push(...events);
    for (const [id, handler] of this.inbound) {
      if (id === fromId) continue;
      if (this.offline.has(id)) {
        const buf = this.pending.get(id) ?? [];
        buf.push(...events);
        this.pending.set(id, buf);
      } else {
        for (const e of events) handler(e);
      }
    }
  }

  private deliverTo(deviceId: string, e: SyncEvent): void {
    this.inbound.get(deviceId)?.(e);
  }

  /** Backlog source reading the server log in insertion order (oldest first). */
  public createBacklogSource(companyId: string): BacklogSource {
    const log = this.serverLog.filter((e) => e.companyId === companyId);
    return {
      pull: async (since: string | null, limit: number): Promise<SyncEvent[]> => {
        const fromIndex = since === null ? 0 : log.findIndex((e) => e.eventId === since) + 1;
        return log.slice(fromIndex, fromIndex + limit);
      },
    };
  }
}

// ─── Virtual device + orchestrating harness ───────────────────────────────────

export class VirtualDevice {
  public readonly id: string;
  public readonly companyId: string;
  public readonly outbox = new InMemoryOutbox();
  public readonly inbox = new InMemoryInbox();
  public readonly idempotency = new InMemoryIdempotencyStore();
  public readonly conflicts = new InMemoryConflicts();
  public readonly replica = new InMemoryReplica();
  public readonly transport: SimulatedTransport;
  public readonly writer: OutboxWriter;
  public readonly drainer: OutboxDrainer;
  public readonly processor: InboxProcessor;

  public constructor(id: string, companyId: string, network: SimulatedNetwork) {
    this.id = id;
    this.companyId = companyId;
    this.transport = new SimulatedTransport(network, id);
    this.transport.receive((e) => void this.inbox.append(e));
    this.writer = new OutboxWriter(this.outbox);
    this.drainer = new OutboxDrainer(this.outbox, this.transport);
    this.processor = new InboxProcessor({
      inbox: this.inbox,
      idempotency: this.idempotency,
      replica: this.replica,
      conflicts: this.conflicts,
    });
  }
}

/**
 * SyncSimulationHarness spins up N in-process virtual devices with fully
 * isolated state and routes events between them over a SimulatedNetwork. It can
 * inject network partitions (offline), delays, and reconnection, and supports
 * deterministic replay of conflict scenarios. It is the MANDATORY test harness
 * that must exist before any conflict-resolution code is written.
 */
export class SyncSimulationHarness {
  public readonly network = new SimulatedNetwork();
  public readonly devices = new Map<string, VirtualDevice>();

  public constructor(
    public readonly companyId: string,
    deviceIds: string[],
  ) {
    for (const id of deviceIds) {
      this.devices.set(id, new VirtualDevice(id, companyId, this.network));
    }
  }

  public getDevice(id: string): VirtualDevice {
    const device = this.devices.get(id);
    if (!device) throw new Error(`Unknown device: ${id}`);
    return device;
  }

  // ── network control ──

  public partition(deviceId: string): void {
    this.network.partition(deviceId);
  }

  public async reconnect(deviceId: string): Promise<void> {
    await this.network.reconnect(deviceId);
  }

  // ── edit helpers (append to a device's outbox, no real write needed) ──

  public async editClassB(
    deviceId: string,
    entityType: string,
    entityId: string,
    field: string,
    value: unknown,
    hlc: HybridLogicalClock,
  ): Promise<SyncEvent> {
    const event = SyncEvent.create({
      eventType: `${entityType}.updated`,
      payload: { entityType, entityId, fields: { [field]: { value, hlc } } },
      hlcTimestamp: hlc,
      deviceId,
      companyId: this.companyId,
    });
    await this.getDevice(deviceId).writer.write(async () => undefined, event);
    // The local write is also applied to the local replica immediately.
    await this.applyLocalClassB(deviceId, entityType, entityId, { [field]: { value, hlc } });
    return event;
  }

  public async editClassA(
    deviceId: string,
    entityId: string,
    eventType: ClassAEvent['eventType'],
    signedQuantity: number,
    hlc: HybridLogicalClock,
  ): Promise<SyncEvent> {
    const event = SyncEvent.create({
      eventType,
      payload: { entityType: 'stock_items', entityId, eventType, signedQuantity },
      hlcTimestamp: hlc,
      deviceId,
      companyId: this.companyId,
    });
    await this.getDevice(deviceId).writer.write(async () => undefined, event);
    await this.getDevice(deviceId).replica.applyClassA([
      { eventId: event.eventId, entityId, eventType, signedQuantity },
    ]);
    return event;
  }

  private async applyLocalClassB(
    deviceId: string,
    entityType: string,
    entityId: string,
    fields: Record<string, FieldState>,
  ): Promise<void> {
    const device = this.getDevice(deviceId);
    const current = await device.replica.getFieldStates(entityType, entityId);
    const { merged } = ClassBMergeService.merge(entityType, entityId, current, fields);
    await device.replica.putFieldStates(entityType, entityId, merged);
  }

  // ── sync primitives ──

  /** One sync round: every online device drains its outbox, then applies its inbox. */
  public async syncRound(): Promise<void> {
    for (const device of this.devices.values()) {
      if (this.network.isOffline(device.id)) continue;
      await device.drainer.drain(device.id, '*');
    }
    for (const device of this.devices.values()) {
      if (this.network.isOffline(device.id)) continue;
      await device.processor.processPending(this.companyId);
    }
  }

  /** Catch a device up from the server log (bounded pages) then apply its inbox. */
  public async catchUp(deviceId: string): Promise<number> {
    const device = this.getDevice(deviceId);
    const source = this.network.createBacklogSource(this.companyId);
    const total = await new BacklogPaginator(source, device.inbox).catchUp(this.companyId);
    await device.processor.processPending(this.companyId);
    return total;
  }

  /** Resolve a conflict on a device and apply the winning value to its replica. */
  public async resolveConflict(
    deviceId: string,
    conflictId: string,
    winner: 'local' | 'remote',
  ): Promise<void> {
    const device = this.getDevice(deviceId);
    const conflict = await device.conflicts.findById(conflictId);
    if (!conflict) throw new Error(`Conflict not found: ${conflictId}`);
    if (winner === 'local') conflict.resolveLocal(null);
    else conflict.resolveRemote(null);
    device.replica.applyResolution(
      conflict.entityType,
      conflict.entityId,
      conflict.field,
      conflict.resolvedValue(winner),
      winner === 'local' ? conflict.localHlc : conflict.remoteHlc,
    );
  }

  public pendingConflicts(deviceId: string): SyncConflict[] {
    return this.getDevice(deviceId)
      .conflicts.all()
      .filter((c) => c.companyId === this.companyId && c.isUnresolved);
  }
}
