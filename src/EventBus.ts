export class EventBus<E extends MachineEvent, T = string> {
  private subscriptions: ((event: E) => void)[] = [];

  on(eventType: T, callback: (event: E) => void) {
    this.subscriptions.push(callback);

    return () => this.off(eventType, callback);
  }

  off(eventType: T, callback: (event: E) => void) {
    this.subscriptions = this.subscriptions.filter((c) => c !== callback);
  }

  send(event: E) {
    this.subscriptions.forEach((callback) => callback(event));
  }

  clear() {
    this.subscriptions = [];
  }
}

type TestEvent =
  | {
      type: 'ALPHA';
      payload: {
        reason: string;
      };
    }
  | {
      type: 'BETA';
      payload: {
        count: number;
      };
    };

const eventBus = new EventBus<TestEvent>();

eventBus.on('ALPHA', (event) => {
  console.log(event);
});
