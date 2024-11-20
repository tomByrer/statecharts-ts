export class EventBus<E extends MachineEvent, T = string> {
  private subscriptions: Map<T | '*', Set<(event: E) => void>>;

  constructor() {
    this.subscriptions = new Map();
    this.subscriptions.set('*', new Set());
  }

  on(eventType: T, callback: (event: E) => void) {
    const currentSet = this.subscriptions.get(eventType) || new Set();
    this.subscriptions.set(eventType, new Set([...currentSet, callback]));

    return () => this.off(eventType, callback);
  }

  off(eventType: T, callback: (event: E) => void) {
    this.subscriptions.get(eventType)?.delete(callback);
  }

  send(event: E) {
    for (const callback of this.subscriptions.get('*') ?? []) {
      callback(event);
    }

    for (const callback of this.subscriptions.get(event.type as T) ?? []) {
      callback(event);
    }
  }

  clear() {
    this.subscriptions.clear();
    this.subscriptions.set('*', new Set());
  }
}
