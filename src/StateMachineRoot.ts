import { EventBus } from './EventBus';
import { RootStateDefinition } from './machineFactory';
import {
  StateMachine,
  MachineState,
  MachineEvent,
  MachineConfig,
} from './StateMachine';

/**
 * Root class for managing a hierarchical state machine.
 *
 * @template E - The type of events that the state machine can handle
 * @template C - The type of the context object
 * @template S - The type of state names (must extend string)
 */
export class StateMachineRoot<E extends MachineEvent, C, S extends string> {
  private subscriptions: ((state: MachineState, context: C) => void)[] = [];
  private state: StateMachine<E, C, S>;
  private context: C;
  private isRunning = false;
  private eventBus: EventBus<E>;

  constructor(private config: RootStateDefinition<E, C>) {
    this.context = config.context;
    this.eventBus = new EventBus();
    this.state = new StateMachine<E, C, S>(
      this.config as MachineConfig<E, C, S>,
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
        eventBus: this.eventBus,
      },
    );
  }

  /**
   * Starts the state machine.
   * Initializes the state machine and notifies subscribers if not already running.
   */
  public start() {
    if (this.isRunning) {
      return;
    }

    this.state.enter();
    this.notifySubscribers();
    this.isRunning = true;
  }

  /**
   * Stops the state machine and performs cleanup.
   */
  public stop() {
    this.isRunning = false;
    this.state.exit();
  }

  /**
   * Updates the context object with new values.
   * @param context - Partial context object to merge with existing context
   */
  updateContext(context: Partial<C>) {
    this.context = structuredClone({ ...this.context, ...context });
  }

  /**
   * Subscribes to state machine updates.
   * @param handler - Callback function that receives current state and context
   * @returns Unsubscribe function
   */
  subscribe(handler: (state: MachineState, context: C) => void) {
    this.subscriptions.push(handler);

    return () => this.unsubscribe(handler);
  }

  /**
   * Unsubscribes a handler from state machine updates.
   * @param handler - The handler function to remove
   */
  unsubscribe(handler: (state: MachineState, context: C) => void) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }

  /**
   * Notifies all subscribers of the current state and context.
   */
  notifySubscribers() {
    const state = this.getState();

    for (const handler of this.subscriptions) {
      handler(state, this.context);
    }
  }

  /**
   * Returns the current state of the state machine.
   * @returns Current machine state
   */
  getState() {
    return this.state.getState();
  }

  /**
   * Returns the current context object.
   * @returns Current context
   */
  getContext() {
    return this.context;
  }

  /**
   * Sends an event to the state machine for processing.
   * @param event - The event to process
   * @throws Error if state machine is not running
   */
  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.state.send(event);
  }
}
