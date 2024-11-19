import { EventBus } from './EventBus';
import { RootStateDefinition } from './machineFactory';
import { StateMachine, MachineEvent, MachineState } from './StateMachine';

type StateChangeHandler<S extends string> = (state: MachineState<S>) => void;

export class StateMachineRoot<E extends MachineEvent, S extends string> {
  private subscriptions: StateChangeHandler<S>[] = [];
  private state: StateMachine<E, S>;
  private isRunning = false;
  private eventBus: EventBus<E>;

  constructor(rootConfig: RootStateDefinition<E, S>) {
    const { states, on, onEntry, onExit, type } = rootConfig;

    this.eventBus = new EventBus();
    this.state = new StateMachine<E, S>(
      { states, on, onEntry, onExit, type },
      {
        eventBus: this.eventBus,
        onTransition: this.notifySubscribers.bind(this),
      },
    );
    this.subscriptions = [];

    this.eventBus.on('*', (event) => {
      console.log('Event:', event);
    });
  }

  subscribe(handler: StateChangeHandler<S>) {
    this.subscriptions.push(handler);
  }

  unsubscribe(handler: StateChangeHandler<S>) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }

  notifySubscribers(state: MachineState<S>) {
    for (const handler of this.subscriptions) {
      handler(state);
    }
  }

  public start() {
    if (this.isRunning) {
      return;
    }

    this.state.enter();
    this.isRunning = true;
  }

  public stop() {
    this.isRunning = false;
    this.state.exit();
  }

  getState() {
    return this.state.getState();
  }

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.state.send(event);
  }
}
