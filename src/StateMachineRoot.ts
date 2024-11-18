import { EventBus } from './EventBus';
import { RootStateDefinition } from './machineFactory';
import { StateMachine, MachineEvent } from './StateMachine';

type StateChangeHandler<M, C> = (state: M, context: C) => void;

export class StateMachineRoot<E extends MachineEvent, C, S extends string> {
  private subscriptions: StateChangeHandler<S, C>[] = [];
  private state: StateMachine<E, C, S>;
  private context: C;
  private isRunning = false;
  private eventBus: EventBus<E>;

  constructor(rootConfig: RootStateDefinition<E, C, S>) {
    const { context, states, on, onEntry, onExit, type } = rootConfig;

    this.context = context;
    this.eventBus = new EventBus();
    this.state = new StateMachine<E, C, S>(
      { states, on, onEntry, onExit, type },
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
        eventBus: this.eventBus,
        onTransition: this.notifySubscribers.bind(this),
      },
    );
    this.subscriptions = [];
  }

  subscribe(handler: StateChangeHandler<S, C>) {
    this.subscriptions.push(handler);
  }

  unsubscribe(handler: StateChangeHandler<S, C>) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }

  notifySubscribers(state: S) {
    for (const handler of this.subscriptions) {
      handler(state, this.context);
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

  updateContext(context: Partial<C>) {
    this.context = structuredClone({ ...this.context, ...context });
  }

  getState() {
    return this.state.getState();
  }

  getContext() {
    return this.context;
  }

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.state.send(event);
  }
}
