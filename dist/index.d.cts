/**
 * Represents an event that can be handled by the state machine.
 *
 * @template T - The type of data that can be carried by the event.
 */
interface MachineEvent<T = unknown> {
    type: string;
    data?: T;
}
/**
 * A callback function that can be scheduled to run after a delay.
 *
 * @template S - The type of state identifier.
 * @returns The state identifier.
 */
type AfterCallback<S> = () => S;
/**
 * A handler function that is called when a state is entered.
 *
 * @template S - The type of state identifier.
 * @param params - Parameters for the entry handler.
 * @param params.after - A function to schedule a callback to run after a delay.
 * @returns The state identifier or void.
 */
type EntryHandler<S> = (params: {
    after: (ms: number, callback: AfterCallback<S>) => void;
}) => S | void;
/**
 * A handler function that is called when a state is exited.
 *
 * @returns Void.
 */
type ExitHandler = () => void;
/**
 * A handler function that is called when an event is handled.
 *
 * @template E - The type of event.
 * @template S - The type of state identifier.
 * @param event - The event being handled.
 * @returns The state identifier or void.
 */
type EventHandler<E, S> = (params: {
    event: E;
}) => S | void;
declare class State<E extends MachineEvent, S extends string> {
    /**
     * Collection of child states.
     */
    private children;
    private parentState;
    /**
     * Active timers managed by this state.
     */
    private timers;
    private listeners;
    private machineContext;
    readonly id: S;
    onEntry?: EntryHandler<S>;
    onExit?: ExitHandler;
    parallel: boolean;
    initial: boolean;
    active: boolean;
    history?: 'shallow' | 'deep';
    constructor(parentState: State<E, S> | null, id: S, machineContext: MachineContext<E, S>);
    /**
     * Adds a child state to the current state.
     *
     * @param child - The child state to add.
     */
    addChild(child: State<E, S>): void;
    /**
     * Registers an event handler for a specific event type.
     *
     * @param eventType - The type of event to listen for.
     * @param handler - The function to call when the specified event is received.
     */
    setListener<T extends E['type']>(eventType: T, handler: EventHandler<Extract<E, {
        type: T;
    }>, S>): void;
    /**
     * Notifies listeners of an event and propagates it to child states if specified.
     */
    notifyListeners(event: E, trickleDown?: boolean): void;
    /**
     * Transitions the state machine to a new state.
     *
     * @param targetId - The identifier of the target state to transition to.
     */
    transitionTo(targetId: S): void;
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
    }>, S>): void;
    /**
     * Enters the state, making it active and handling any necessary transitions or child state entries.
     */
    enter(serialisedState?: SerialisedState): void;
    /**
     * Exits the state, deactivating it and clearing all timers.
     * If preserveHistory is not specified or false, the state is deactivated.
     * If preserveHistory is 'shallow' or 'deep', the state's history is preserved.
     * If the onExit handler is defined, it is executed.
     * If the state has active children, they are exited, preserving history if specified.
     *
     * @param preserveHistory - If 'shallow' or 'deep', the state's history is preserved.
     */
    exit(preserveHistory?: 'shallow' | 'deep'): void;
    /**
     * Schedules a transition to a new state after a specified delay.
     *
     * @param ms - The delay in milliseconds before transitioning to the new state.
     * @param callback - A function that returns the ID of the state to transition to.
     */
    after(ms: number, callback: AfterCallback<S>): void;
    /**
     * Returns an array of active children of the state.
     * Active children are those that have their active property set to true.
     *
     * @returns {State<E, S>[]} - An array of active children of the state.
     */
    getActiveChildren(): State<E, S>[];
    /**
     * Finds and returns a child state by its ID.
     *
     * @param id - The ID of the child state to find.
     * @returns {State<E, S>} - The child state with the specified ID, or undefined if not found.
     */
    getChildById(id: S): State<E, S> | undefined;
    /**
     * Finds and returns a sibling state by its ID.
     *
     * @param id - The ID of the sibling state to find.
     * @returns {State<E, S>} - The sibling state with the specified ID, or undefined if not found.
     */
    getSiblingById(id: S): State<E, S> | undefined;
    /**
     * Finds and returns a state by its ID, searching through children, siblings, and the state registry.
     *
     * @param id - The ID of the state to find.
     * @returns {State<E, S>} - The state with the specified ID, or throws an error if not found.
     */
    getStateById(id: S): State<E, S>;
}

/**
 * Configuration for a state in the state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template S - The type of state identifiers.
 */
type StateConfig<E extends MachineEvent, S extends string> = {
    /**
     * Events that the state can handle, defined as a union of event types.
     * Example: `{ type: 'EVENT_A' } | { type: 'EVENT_B' }`
     */
    events?: E;
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
        [K in string]: StateConfig<E, S>;
    }>;
    /**
     * Event handler mappings
     */
    on?: {
        [K in E['type']]?: EventHandler<Extract<E, {
            type: K;
        }>, S>;
    };
    /**
     * Entry handler with optional state transition
     */
    onEntry?: EntryHandler<S>;
    /**
     * Exit handler for cleanup operations
     */
    onExit?: ExitHandler;
};
type StateRegistry<E extends MachineEvent, S extends string> = Map<S, State<E, S>>;
type MachineContext<E extends MachineEvent, S extends string> = {
    stateRegistry: StateRegistry<E, S>;
    notifyListeners: () => void;
};
type SubscribeHandler<S = string> = (state: SerialisedState<S>) => void;
type SerialisedState<S = string> = S | {
    [K in string]: SerialisedState<S>;
};
declare class StateMachine<E extends MachineEvent, S extends string> {
    private listeners;
    private stateRegistry;
    rootState: State<E, S>;
    get isRunning(): boolean;
    constructor(rootConfig: StateConfig<E, S>);
    buildState(config: StateConfig<E, S>, parent: State<E, S> | null, id: S): State<E, S>;
    getStateById(id: S): State<E, S> | undefined;
    subscribe(handler: SubscribeHandler): () => void;
    unsubscribe(handler: SubscribeHandler): void;
    notifyListeners(state: State<E, S>): void;
    start(serialisedState?: SerialisedState): void;
    stop(): void;
    value(): SerialisedState<S>;
    send(event: E): void;
    serialise(state: State<E, S>): SerialisedState<S>;
}

/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 */
declare function machineFactory<E extends MachineEvent, S extends string>(config: StateConfig<E, S>): StateMachine<E, S>;

export { machineFactory };
