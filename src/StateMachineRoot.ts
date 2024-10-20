import { RootStateDefinition } from './machineFactory';
import { StateMachine, MachineState, MachineEvent } from './stateMachine';

/**
 * Class representing the root state machine.
 * @template C - The type of the context object.
 */
export class StateMachineRoot<C> {
  private subscriptions: ((state: MachineState, context: C) => void)[] = [];
  private state: StateMachine<C>;
  private context: C;
  private isRunning = false;

  constructor(private config: RootStateDefinition<C>) {
    this.context = config.context;
    this.state = new StateMachine(
      this.config,
      {
        name: '$',
        transition: () => {},
        getPathToState: () => [],
        onTransition: this.notifySubscribers.bind(this),
      },
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
      }
    );
  }

  public start() {
    if (this.isRunning) {
      return;
    }

    this.state.initialise();
    this.notifySubscribers();
    this.isRunning = true;
  }

  public stop() {
    this.isRunning = false;
    this.state.dispose();
  }

  updateContext(context: Partial<C>) {
    this.context = structuredClone({ ...this.context, ...context });
  }

  subscribe(handler: (state: MachineState, context: C) => void) {
    this.subscriptions.push(handler);

    return () => this.unsubscribe(handler);
  }

  unsubscribe(handler: (state: MachineState, context: C) => void) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }

  notifySubscribers() {
    const state = this.getState();

    for (const handler of this.subscriptions) {
      handler(state, this.context);
    }
  }

  getState() {
    return this.state.getState();
  }

  getContext() {
    return this.context;
  }

  send(event: MachineEvent) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.state.send(event);
  }
}
