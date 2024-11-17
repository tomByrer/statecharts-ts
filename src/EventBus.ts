export class EventBus<E extends MachineEvent> {
  private subscriptions: ((event: E) => void)[] = [];

  on(event: E, callback: (event: E) => void) {
    this.subscriptions.push(callback);
  }

  off(event: E, callback: (event: E) => void) {
    this.subscriptions = this.subscriptions.filter((c) => c !== callback);
  }

  send(event: E) {
    this.subscriptions.forEach((callback) => callback(event));
  }

  clear() {
    this.subscriptions = [];
  }
}
