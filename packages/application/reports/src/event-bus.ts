export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  async publish<T>(eventType: string, event: T): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) return;
    const results = Array.from(handlers).map((handler) => handler(event));
    await Promise.all(results);
  }
}

export const eventBus = new EventBus();
