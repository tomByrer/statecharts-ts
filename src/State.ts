// State.ts
import { SerialisedState, type MachineContext } from './StateMachine';

/**
 * Represents an event that can be handled by the state machine.
 *
 * @template T - The type of data that can be carried by the event.
 */
export type MachineEvent<D = unknown> = {
  type: 'START' | 'STOP' | 'AFTER_DELAY' | string;
  data?: D;
};

/**
 * A callback function that can be scheduled to run after a delay.
 *
 * @template S - The type of state identifier.
 * @returns The state identifier.
 */
type AfterCallback<S, C> = ({
  context,
  setContext,
}: {
  context: C;
  setContext: (context: C) => void;
}) => Promise<S | void> | S | void;

/**
 * A handler function that is called when a state is entered.
 *
 * @template S - The type of state identifier.
 * @param params - Parameters for the entry handler.
 * @param params.after - A function to schedule a callback to run after a delay.
 * @returns The state identifier or void.
 */
export type EntryHandler<S, C, E> = (params: {
  after: (ms: number, callback: AfterCallback<S, C>) => void;
  context: C;
  setContext: (context: C | ((context: C) => C)) => C;
  event: E;
}) => Promise<S | void> | S | void;

/**
 * A handler function that is called when a state is exited.
 *
 * @returns Void.
 */
export type ExitHandler<C, E> = (params: {
  context: C;
  setContext: (context: C) => void;
  event: E;
}) => Promise<void>;

/**
 * A handler function that is called when an event is handled.
 *
 * @template E - The type of event.
 * @template S - The type of state identifier.
 * @param event - The event being handled.
 * @returns The state identifier or void.
 */
export type EventHandler<E, S, C> = (params: {
  event: E;
  context: C;
  setContext: (context: C) => void;
}) => S | void;

export class StateRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateRegistryError';
  }
}

export class State<E extends MachineEvent, S extends string, C = unknown> {
  /**
   * Collection of child states.
   */
  private children: State<E, S, C>[] = [];
  private parentState: State<E, S, C> | null;
  /**
   * Active timers managed by this state.
   */
  private timers: ReturnType<typeof setTimeout>[] = [];
  private handlers: Partial<{
    [K in E['type']]: EventHandler<Extract<E, { type: K }>, S, C>;
  }> = {};
  private machineContext: MachineContext<E, S, C>;

  readonly id: S;
  onEntry?: EntryHandler<S, C, E>;
  onExit?: ExitHandler<C, E>;
  parallel = false;
  initial: boolean = false;
  active: boolean = false;
  history?: 'shallow' | 'deep';

  constructor(
    parentState: State<E, S, C> | null,
    id: S,
    machineContext: MachineContext<E, S, C>,
  ) {
    this.id = id;
    this.parentState = parentState;
    this.machineContext = machineContext;
  }

  /**
   * Adds a child state to the current state.
   *
   * @param child - The child state to add.
   * @throws {StateRegistryError} When attempting to register a duplicate state ID
   */
  addChild(child: State<E, S, C>) {
    this.children.push(child);

    if (this.machineContext.stateRegistry.has(child.id)) {
      this.children.pop(); // Remove the child we just added

      throw new StateRegistryError(
        `Cannot register state: ID "${child.id}" is already registered in the state machine.`,
      );
    }

    this.machineContext.stateRegistry.set(child.id, child);
  }

  /**
   * Registers an event handler for a specific event type.
   *
   * @param eventType - The type of event to listen for.
   * @param handler - The function to call when the specified event is received.
   */
  setHandler<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, S, C>,
  ) {
    this.handlers[eventType] = handler;
  }

  /**
   * Notifies listeners of an event and propagates it to child states if specified.
   *
   * @param event - The event to notify listeners of.
   * @param trickleDown - Whether to trickle down the event to child states.
   */
  notifyHandlers(params: { event: E; trickleDown?: boolean }) {
    const { event, trickleDown = true } = params;

    if (this.active) {
      const handler = this.handlers[event.type as E['type']];

      if (handler) {
        const targetId = handler({
          event: event as Extract<E, { type: E['type'] }>,
          context: this.machineContext.context,
          setContext: this.machineContext.setContext,
        });

        if (targetId) {
          this.transitionTo({ targetId, event });
        }
      }
    }

    if (trickleDown) {
      this.notifyChildren(event);
    }
  }

  /**
   * Transitions the state machine to a new state.
   *
   * @param targetId - The identifier of the target state to transition to.
   * @param event - The event to transition to the target state with.
   */
  transitionTo(params: { targetId: S; event: E }) {
    const { targetId, event } = params;
    // Retrieve the target state by its identifier
    const targetState = this.getStateById(targetId);

    // Exit the current state
    this.exit({ event });
    // Enter the target state
    targetState.enter({ event });
    // Notify all listeners of the state change
    this.machineContext.notifyHandlers(event);
  }

  /**
   * Notifies all active child states of an event.
   *
   * @param event - The event to notify the child states of.
   */
  notifyChildren(event: E) {
    // Iterate over all active child states
    for (const child of this.getActiveChildren()) {
      // Notify each active child state of the event
      child.notifyHandlers({ event });
    }
  }

  /**
   * Registers a listener for a specific event type.
   *
   * @template T - The type of the event to listen for.
   * @param eventType - The type of the event to listen for.
   * @param handler - The function to call when the event is received.
   */
  on<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, S, C>,
  ) {
    this.setHandler(eventType, handler);
  }

  /**
   * Enters the state, making it active and handling any necessary transitions or child state entries.
   */
  async enter(params: { serialisedState?: SerialisedState; event: E }) {
    const { serialisedState, event } = params;
    // Set the state as active
    this.active = true;

    // Bind the after function to the current state context
    const { context, setContext } = this.machineContext;
    const after = this.after.bind(this);

    // Check if there's an onEntry handler and execute it if present
    if (this.onEntry) {
      // Execute the onEntry handler, passing the bound after function
      const targetId = await this.onEntry({
        after,
        context,
        setContext,
        event,
      });

      // If the onEntry handler returns a targetId, transition to that state
      if (targetId) {
        this.transitionTo({ targetId, event });
      }
    }

    // If a serialised state is provided, transition to it
    if (serialisedState) {
      if (typeof serialisedState === 'string') {
        this.transitionTo({ targetId: serialisedState as S, event });
      } else if (!this.parallel && this.children.length > 0) {
        this.children.forEach((child) => {
          child.enter({ serialisedState: serialisedState[child.id], event });
        });
      }

      return;
    }

    // If there are no children, exit the function early
    if (this.children.length === 0) {
      return;
    }

    // Check if the state is parallel, meaning it can have multiple active child states
    if (this.parallel) {
      // If parallel, enter all child states
      for (const child of this.children) {
        child.enter({ event });
      }
    } else {
      // If not parallel, find the initial child state(s)
      const initialChildren = this.children.filter((child) => child.initial);

      // Warn if there are multiple initial states
      if (initialChildren.length > 1) {
        console.warn(
          `Multiple initial states found for state ${this.id}. Using first match.`,
        );
      }

      // Select the first initial child state or the first child state if no initial state is found
      const initialChild = initialChildren[0] ?? this.children[0];

      // Enter the selected initial child state
      initialChild.enter({ event });
    }
  }

  /**
   * Exits the state, deactivating it and clearing all timers.
   * If preserveHistory is not specified or false, the state is deactivated.
   * If preserveHistory is 'shallow' or 'deep', the state's history is preserved.
   * If the onExit handler is defined, it is executed.
   * If the state has active children, they are exited, preserving history if specified.
   *
   * @param preserveHistory - If 'shallow' or 'deep', the state's history is preserved.
   */
  async exit(params: { preserveHistory?: 'shallow' | 'deep'; event: E }) {
    const { preserveHistory, event } = params;

    // Perform cleanup unless we're preserving history
    if (!preserveHistory) {
      this.cleanup();
      this.active = false;
    }

    // Clear all timers regardless of history
    this.timers.forEach(clearTimeout);
    this.timers = [];

    const { context, setContext: originalSetContext } = this.machineContext;
    const wrappedSetContext = (contextOrFn: C | ((context: C) => C)) => {
      const newContext =
        typeof contextOrFn === 'function'
          ? (contextOrFn as (context: C) => C)(context)
          : contextOrFn;
      return originalSetContext(newContext);
    };

    await this.onExit?.({
      context,
      setContext: wrappedSetContext,
      event,
    });

    // Exit active children, preserving history if specified
    const historyToPreserve =
      preserveHistory === 'deep' ? 'deep' : this.history;
    this.children.forEach((child) => {
      if (child.active) {
        child.exit({ preserveHistory: historyToPreserve, event });
      }
    });
  }

  /**
   * Schedules a transition to a new state after a specified delay.
   *
   * @param ms - The delay in milliseconds before transitioning to the new state.
   * @param callback - A function that returns the ID of the state to transition to.
   */
  after(ms: number, callback: AfterCallback<S, C>) {
    const { context, setContext } = this.machineContext;

    // Create a timer that will execute the callback function after the specified delay
    const timer = setTimeout(async () => {
      // Execute the callback function to get the ID of the state to transition to
      const stateId = await callback({ context, setContext });
      // Transition to the new state
      this.transitionTo({
        targetId: stateId as S,
        event: { type: 'AFTER_DELAY' } as E,
      });
    }, ms);

    // Store the timer to ensure it can be cleared later if necessary
    this.timers.push(timer);
  }

  /**
   * Returns an array of active children of the state.
   * Active children are those that have their active property set to true.
   *
   * @returns {State<E, S>[]} - An array of active children of the state.
   */
  getActiveChildren(): State<E, S, C>[] {
    return this.children.filter((child) => child.active);
  }

  /**
   * Finds and returns a child state by its ID.
   *
   * @param id - The ID of the child state to find.
   * @returns {State<E, S>} - The child state with the specified ID, or undefined if not found.
   */
  getChildById(id: S) {
    return this.children.find((child) => child.id === id);
  }

  /**
   * Finds and returns a sibling state by its ID.
   *
   * @param id - The ID of the sibling state to find.
   * @returns {State<E, S>} - The sibling state with the specified ID, or undefined if not found.
   */
  getSiblingById(id: S) {
    // Attempt to find the sibling state by its ID through the parent state
    return this.parentState?.getChildById(id);
  }

  /**
   * Finds and returns a state by its ID, searching through children, siblings, and the state registry.
   *
   * @param id - The ID of the state to find.
   * @returns {State<E, S>} - The state with the specified ID, or throws an error if not found.
   */
  getStateById(id: S) {
    // Attempt to find the state by its ID through children, siblings, and the state registry
    const state =
      this.getChildById(id) ??
      this.getSiblingById(id) ??
      this.machineContext.stateRegistry.get(id);

    // If the state is not found, throw an error
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }

    // Return the found state
    return state;
  }

  /**
   * Cleans up all resources associated with this state and its children.
   * This includes timers and any registered handlers.
   */
  cleanup() {
    // Clear all timers
    this.timers.forEach(clearTimeout);
    this.timers = [];

    // Clear all handlers
    this.handlers = {};

    // Recursively cleanup children
    this.children.forEach((child) => child.cleanup());
  }
}
