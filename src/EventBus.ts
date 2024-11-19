export class EventBus<E extends MachineEvent, T = string> {
  private subscriptions: Map<T | '*', Set<(event: E) => void>>;

  constructor() {
    this.subscriptions = new Map();
    this.subscriptions.set('*', new Set());
  }

  on(eventType: T, callback: (event: E) => void) {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    this.subscriptions.get(eventType)!.add(callback);

    return () => this.off(eventType, callback);
  }

  off(eventType: T, callback: (event: E) => void) {
    this.subscriptions.get(eventType)?.delete(callback);
  }

  send(event: E) {
    // this.subscriptions.get('*')?.forEach((callback) => callback(event));
    const callbacks = this.subscriptions.get(event.type as T);

    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  clear() {
    this.subscriptions.clear();
    this.subscriptions.set('*', new Set());
  }
}
