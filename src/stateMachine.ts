// StateMachine.ts

import {
  State,
  MachineEvent,
  EntryHandler,
  ExitHandler,
  EventHandler,
} from './State';

/**
 * Configuration for a state in the state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template S - The type of state identifiers.
 */
export type StateConfig<
  E extends MachineEvent,
  S extends string,
  C = unknown,
> = {
  /**
   * Events that the state can handle, defined as a union of event types.
   * Example: `{ type: 'EVENT_A' } | { type: 'EVENT_B' }`
   */
  events?: E;

  /**
   * Context object that is passed to the state machine.
   */
  context?: C;

  /**
   * When true, enables concurrent execution of all child states.
   */
  parallel?: boolean;

  /**
   * Designates the entry point for the state machine.
   * Defaults to the first child state if not specified.
   */
  initial?: boolean;

  /**
   * Determines state history retention behavior:
   * - shallow: Remembers only immediate child states
   * - deep: Remembers the complete subtree of active states
   */
  history?: 'shallow' | 'deep';

  /**
   * Nested state configuration hierarchy
   */
  states?: Partial<{
    [K in string]: StateConfig<E, S, C>;
  }>;

  /**
   * Event handler mappings
   */
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, S, C>;
  };

  /**
   * Entry handler with optional state transition
   */
  onEntry?: EntryHandler<S, C, E>;

  /**
   * Exit handler for cleanup operations
   */
  onExit?: ExitHandler<C, E>;
};

export type StateRegistry<
  E extends MachineEvent,
  S extends string,
  C = unknown,
> = Map<S, State<E, S, C>>;

type ContextOrFn<C> = C | ((context: C) => C);

export type MachineContext<
  E extends MachineEvent,
  S extends string,
  C = unknown,
> = {
  stateRegistry: StateRegistry<E, S, C>;
  notifyHandlers: (event?: E) => void;
  context: C;
  setContext: (context: ContextOrFn<C>) => C;
};

type SubscribeHandler<S = string> = (state: SerialisedState<S>) => void;

export type SerialisedState<S = string> =
  | S
  | { [K in string]: SerialisedState<S> };

export type RootConfig<
  E extends MachineEvent,
  S extends string,
  C = unknown,
> = StateConfig<E, S, C> & {
  events: E;
  context: C;
};

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export class StateMachine<
  E extends MachineEvent,
  S extends string,
  C = unknown,
> {
  private handlers: SubscribeHandler[] = [];
  private stateRegistry: StateRegistry<E, S, C> = new Map();
  private context: C;

  rootState: State<E, S, C>;

  /**
   * Returns true if the state machine is running.
   *
   * @returns True if the state machine is running.
   */
  isRunning() {
    return this.rootState.active;
  }

  /**
   * Constructs a new state machine.
   */
  constructor(rootConfig: RootConfig<E, S, C>) {
    const { context, ...config } = rootConfig;

    this.handlers = [];
    this.context = context ?? ({} as C);
    this.rootState = this.buildState(config, null, 'root' as S);
  }

  setContext(context: ContextOrFn<C>) {
    this.context =
      typeof context === 'function'
        ? (context as (context: C) => C)(this.context)
        : context;

    return this.context;
  }

  /**
   * Builds a state from a configuration object.
   *
   * @param config - The configuration object for the state.
   * @param parent - The parent state of the new state.
   * @param id - The id of the new state.
   * @returns The new state.
   */
  buildState(
    config: StateConfig<E, S, C>,
    parent: State<E, S, C> | null,
    id: S,
  ) {
    const machineContext: MachineContext<E, S, C> = {
      stateRegistry: this.stateRegistry,
      notifyHandlers: () => this.notifyHandlers(this.rootState),
      context: this.context,
      setContext: this.setContext.bind(this),
    };

    const state = new State<E, S, C>(parent, id, machineContext);

    state.parallel = config.parallel ?? false;
    state.onEntry = config.onEntry;
    state.onExit = config.onExit;
    state.initial = config.initial ?? false;

    for (const event in config.on) {
      const handler = config.on[event as E['type']]!;

      state.setHandler(event as E['type'], handler);
    }

    if (config.states) {
      const stateEntries = Object.entries(config.states);

      for (const [childId, childConfig] of stateEntries) {
        const childState = this.buildState(childConfig!, state, childId as S);

        state.addChild(childState as State<E, S, C>);
      }
    }

    return state;
  }

  /**
   * Returns the state with the given id.
   *
   * @param id - The id of the state to return.
   * @returns The state with the given id.
   */
  getStateById(id: S) {
    return this.stateRegistry.get(id);
  }

  /**
   * Subscribes a handler to the state machine.
   *
   * @param handler - The handler to subscribe.
   * @returns A function to unsubscribe the handler.
   */
  subscribe(handler: SubscribeHandler) {
    this.handlers.push(handler);

    return () => this.unsubscribe(handler);
  }

  /**
   * Unsubscribes a handler from the state machine.
   *
   * @param handler - The handler to unsubscribe.
   */
  unsubscribe(handler: SubscribeHandler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  /**
   * Notifies handlers of a state change.
   *
   * @param state - The state to notify handlers of.
   */
  notifyHandlers(state: State<E, S, C>) {
    const serialisedState = this.serialise(state);

    for (const handler of this.handlers) {
      handler(serialisedState);
    }
  }

  /**
   * Starts the state machine.
   *
   * @param serialisedState - The serialised state to start the state machine in.
   */
  public start(serialisedState?: SerialisedState) {
    if (this.isRunning) {
      return;
    }

    this.rootState.enter({
      serialisedState,
      event: { type: 'START' } as E,
    });

    this.notifyHandlers(this.rootState);
  }

  /**
   * Stops the state machine.
   */
  public stop() {
    this.rootState.exit({ event: { type: 'STOP' } as E });
  }

  /**
   * Returns the current state of the state machine as a serialised state object.
   *
   */
  getState(): SerialisedState<S> {
    return this.serialise(this.rootState);
  }

  /**
   * Returns the context of the state machine.
   *
   * @returns The context of the state machine.
   */
  getContext(): C {
    return this.context;
  }

  /**
   * Sends an event to the state machine.
   *
   * @param event - The event to send.
   * @throws {StateMachineError} When the state machine is not running or event handling fails
   */
  send(event: E) {
    if (!this.isRunning) {
      throw new StateMachineError(
        'Cannot send events when state machine is not running',
      );
    }

    try {
      this.rootState.notifyHandlers({ event });
    } catch (error) {
      throw new StateMachineError(
        `Failed to handle event "${event.type}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Serialises the state of the state machine into a serialised state object.
   *
   * @param state - The state to serialise.
   * @returns The serialised state.
   */
  serialise(state: State<E, S, C>): SerialisedState<S> {
    const activeChildren = state.getActiveChildren();

    if (activeChildren.length === 1) {
      return activeChildren[0].id as unknown as S;
    }

    return state.getActiveChildren().reduce(
      (acc, state) => {
        acc[state.id as string] = this.serialise(state);
        return acc;
      },
      {} as Record<string, SerialisedState<S>>,
    );
  }
}
