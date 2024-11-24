/**
 * Represents an event that can be handled by the state machine.
 *
 * @template T - The type of data that can be carried by the event.
 */
type MachineEvent<D = unknown> = {
    type: 'START' | 'STOP' | 'AFTER_DELAY' | string;
    data?: D;
};
/**
 * A callback function that can be scheduled to run after a delay.
 *
 * @template S - The type of state identifier.
 * @returns The state identifier.
 */
type AfterCallback<S, C> = ({ context, setContext, }: {
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
type EntryHandler<S, C, E> = (params: {
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
type ExitHandler<C, E> = (params: {
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
type EventHandler<E, S, C> = (params: {
    event: E;
    context: C;
    setContext: (context: C) => void;
}) => S | void;
declare class State<E extends MachineEvent, S extends string, C = unknown> {
    /**
     * Collection of child states.
     */
    private children;
    private parentState;
    /**
     * Active timers managed by this state.
     */
    private timers;
    private handlers;
    private machineContext;
    readonly id: S;
    onEntry?: EntryHandler<S, C, E>;
    onExit?: ExitHandler<C, E>;
    parallel: boolean;
    initial: boolean;
    active: boolean;
    history?: 'shallow' | 'deep';
    constructor(parentState: State<E, S, C> | null, id: S, machineContext: MachineContext<E, S, C>);
    /**
     * Adds a child state to the current state.
     *
     * @param child - The child state to add.
     * @throws {StateRegistryError} When attempting to register a duplicate state ID
     */
    addChild(child: State<E, S, C>): void;
    /**
     * Registers an event handler for a specific event type.
     *
     * @param eventType - The type of event to listen for.
     * @param handler - The function to call when the specified event is received.
     */
    setHandler<T extends E['type']>(eventType: T, handler: EventHandler<Extract<E, {
        type: T;
    }>, S, C>): void;
    /**
     * Notifies listeners of an event and propagates it to child states if specified.
     *
     * @param event - The event to notify listeners of.
     * @param trickleDown - Whether to trickle down the event to child states.
     */
    notifyHandlers(params: {
        event: E;
        trickleDown?: boolean;
    }): void;
    /**
     * Transitions the state machine to a new state.
     *
     * @param targetId - The identifier of the target state to transition to.
     * @param event - The event to transition to the target state with.
     */
    transitionTo(params: {
        targetId: S;
        event: E;
    }): void;
    /**
     * Notifies all active child states of an event.
     *
     * @param event - The event to notify the child states of.
     */
    notifyChildren(event: E): void;
    /**
     * Registers a listener for a specific event type.
     *
     * @template T - The type of the event to listen for.
     * @param eventType - The type of the event to listen for.
     * @param handler - The function to call when the event is received.
     */
    on<T extends E['type']>(eventType: T, handler: EventHandler<Extract<E, {
        type: T;
    }>, S, C>): void;
    /**
     * Enters the state, making it active and handling any necessary transitions or child state entries.
     */
    enter(params: {
        serialisedState?: SerialisedState;
        event: E;
    }): Promise<void>;
    /**
     * Exits the state, deactivating it and clearing all timers.
     * If preserveHistory is not specified or false, the state is deactivated.
     * If preserveHistory is 'shallow' or 'deep', the state's history is preserved.
     * If the onExit handler is defined, it is executed.
     * If the state has active children, they are exited, preserving history if specified.
     *
     * @param preserveHistory - If 'shallow' or 'deep', the state's history is preserved.
     */
    exit(params: {
        preserveHistory?: 'shallow' | 'deep';
        event: E;
    }): Promise<void>;
    /**
     * Schedules a transition to a new state after a specified delay.
     *
     * @param ms - The delay in milliseconds before transitioning to the new state.
     * @param callback - A function that returns the ID of the state to transition to.
     */
    after(ms: number, callback: AfterCallback<S, C>): void;
    /**
     * Returns an array of active children of the state.
     * Active children are those that have their active property set to true.
     *
     * @returns {State<E, S>[]} - An array of active children of the state.
     */
    getActiveChildren(): State<E, S, C>[];
    /**
     * Finds and returns a child state by its ID.
     *
     * @param id - The ID of the child state to find.
     * @returns {State<E, S>} - The child state with the specified ID, or undefined if not found.
     */
    getChildById(id: S): State<E, S, C> | undefined;
    /**
     * Finds and returns a sibling state by its ID.
     *
     * @param id - The ID of the sibling state to find.
     * @returns {State<E, S>} - The sibling state with the specified ID, or undefined if not found.
     */
    getSiblingById(id: S): State<E, S, C> | undefined;
    /**
     * Finds and returns a state by its ID, searching through children, siblings, and the state registry.
     *
     * @param id - The ID of the state to find.
     * @returns {State<E, S>} - The state with the specified ID, or throws an error if not found.
     * @throws {Error} When the state is not found
     */
    getStateById(id: S): State<E, S, C>;
    /**
     * Cleans up all resources associated with this state and its children.
     * This includes timers and any registered handlers.
     */
    cleanup(): void;
}

/**
 * Configuration for a state in the state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template S - The type of state identifiers.
 */
type StateConfig<E extends MachineEvent, S extends string, C = unknown> = {
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
        [K in E['type']]?: EventHandler<Extract<E, {
            type: K;
        }>, S, C>;
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
type StateRegistry<E extends MachineEvent, S extends string, C = unknown> = Map<S, State<E, S, C>>;
type ContextOrFn<C> = C | ((context: C) => C);
type MachineContext<E extends MachineEvent, S extends string, C = unknown> = {
    stateRegistry: StateRegistry<E, S, C>;
    notifyHandlers: (event?: E) => void;
    context: C;
    setContext: (context: ContextOrFn<C>) => C;
};
type SubscribeHandler<S = string> = (state: SerialisedState<S>) => void;
type SerialisedState<S = string> = S | {
    [K in string]: SerialisedState<S>;
};
type RootConfig<E extends MachineEvent, S extends string, C = unknown> = StateConfig<E, S, C> & {
    events: E;
    context: C;
};
declare class StateMachine<E extends MachineEvent, S extends string, C = unknown> {
    private handlers;
    private stateRegistry;
    private context;
    rootState: State<E, S, C>;
    /**
     * Returns true if the state machine is running.
     *
     * @returns True if the state machine is running.
     */
    get isRunning(): boolean;
    /**
     * Constructs a new state machine.
     */
    constructor(rootConfig: RootConfig<E, S, C>);
    setContext(context: ContextOrFn<C>): C;
    /**
     * Builds a state from a configuration object.
     *
     * @param config - The configuration object for the state.
     * @param parent - The parent state of the new state.
     * @param id - The id of the new state.
     * @returns The new state.
     */
    buildState(config: StateConfig<E, S, C>, parent: State<E, S, C> | null, id: S): State<E, S, C>;
    /**
     * Returns the state with the given id.
     *
     * @param id - The id of the state to return.
     * @returns The state with the given id.
     */
    getStateById(id: S): State<E, S, C> | undefined;
    /**
     * Subscribes a handler to the state machine.
     *
     * @param handler - The handler to subscribe.
     * @returns A function to unsubscribe the handler.
     */
    subscribe(handler: SubscribeHandler): () => void;
    /**
     * Unsubscribes a handler from the state machine.
     *
     * @param handler - The handler to unsubscribe.
     */
    unsubscribe(handler: SubscribeHandler): void;
    /**
     * Notifies handlers of a state change.
     *
     * @param state - The state to notify handlers of.
     */
    notifyHandlers(state: State<E, S, C>): void;
    /**
     * Starts the state machine.
     *
     * @param serialisedState - The serialised state to start the state machine in.
     */
    start(serialisedState?: SerialisedState): void;
    /**
     * Stops the state machine.
     */
    stop(): void;
    /**
     * Returns the current state of the state machine as a serialised state object.
     *
     */
    value(): SerialisedState<S>;
    /**
     * Sends an event to the state machine.
     *
     * @param event - The event to send.
     * @throws {StateMachineError} When the state machine is not running or event handling fails
     */
    send(event: E): void;
    /**
     * Serialises the state of the state machine into a serialised state object.
     *
     * @param state - The state to serialise.
     * @returns The serialised state.
     */
    serialise(state: State<E, S, C>): SerialisedState<S>;
}

/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 *
 * @param config - The configuration object for the state machine.
 * @returns A new state machine.
 */
declare function machineFactory<E extends MachineEvent, C, S extends string = string>(config: RootConfig<E, S, C>): StateMachine<E, S, C>;

export { machineFactory };
