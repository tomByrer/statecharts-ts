import { RootStateDefinition } from './machineFactory';
import {
  StateMachine,
  MachineState,
  MachineEvent,
  MachineConfig,
} from './stateMachine';

/**
 * Class representing the root state machine.
 * @template C - The type of the context object.
 */
export class StateMachineRoot<E extends MachineEvent, C, S extends string> {
  private subscriptions: ((state: MachineState, context: C) => void)[] = [];
  private state: StateMachine<E, C, S>;
  private context: C;
  private isRunning = false;
  private stateMap: Map<S, StateMachine<E, C, S>>;

  constructor(private config: RootStateDefinition<E, C>) {
    this.context = config.context;
    this.stateMap = new Map();
    this.state = new StateMachine<E, C, S>(
      this.config as MachineConfig<E, C, S>,
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
        stateMap: this.stateMap,
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

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.state.send(event);
  }
}
