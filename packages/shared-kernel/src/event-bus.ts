/**
 * Internal Event Bus — the single in-process pub/sub used by application
 * workers (notification dispatcher, projection worker, etc.) to react to
 * Domain Events. Domain commands / route handlers publish the relevant
 * DomainEvent; subscribers decide what to do with it. This keeps notification
 * logic centralized and independent of the domain action that caused it
 * (Notifications.md §1, BR-NOT-001).
 */
import type { DomainEventBase } from './domain-event-base';

export type DomainEventMap = Record<string, unknown>;
export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

export const ALL_EVENTS = '*';

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  /** Subscribe to a specific event type or to ALL_EVENTS ('*'). Returns an unsubscribe fn. */
  public subscribe<T = unknown>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const set = this.handlers.get(eventType)!;
    set.add(handler as EventHandler);
    return () => {
      set.delete(handler as EventHandler);
    };
  }

  public async publish<T extends DomainEventBase>(event: T): Promise<void> {
    const type = event.constructor.name;
    const specific = this.handlers.get(type);
    const wildcard = this.handlers.get(ALL_EVENTS);
    const tasks: Array<Promise<void> | void> = [];

    if (specific) {
      for (const h of specific) tasks.push(h(event));
    }
    if (wildcard) {
      for (const h of wildcard) tasks.push(h(event));
    }
    await Promise.all(tasks);
  }

  /** Synchronous publish variant (used in tests / non-async contexts). */
  public publishSync<T extends DomainEventBase>(event: T): void {
    const type = event.constructor.name;
    const specific = this.handlers.get(type);
    const wildcard = this.handlers.get(ALL_EVENTS);
    specific?.forEach((h) => h(event));
    wildcard?.forEach((h) => h(event));
  }

  public clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
