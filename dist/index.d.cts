type SerialisedState<S = string> = S | {
    [K in string]: SerialisedState<S>;
};
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
type AfterCallback<C> = ({ context, setContext, updateContext, }: {
    context: C;
    setContext: (context: C) => void;
    updateContext: (callback: (context: C) => C) => void;
}) => Promise<string | void> | string | void;
/**
 * A handler function that is called when a state is entered.
 *
 * @template S - The type of state identifier.
 * @param params - Parameters for the entry handler.
 * @param params.after - A function to schedule a callback to run after a delay.
 * @returns The state identifier or void.
 */
type EntryHandler<C> = (params: {
    after: (ms: number, callback: AfterCallback<C>) => void;
    context: C;
}) => Promise<string | void> | string | void;
/**
 * A handler function that is called when a state is exited.
 *
 * @returns Void.
 */
type ExitHandler<C> = (params: {
    context: C;
}) => Promise<void>;
/**
 * A handler function that is called when a transition is made.
 *
 * @returns Void.
 */
type TransitionHandler<C> = (params: {
    state: SerialisedState<string>;
    context: C;
}) => Promise<void> | void;
/**
 * A handler function that is called when an event is handled.
 *
 * @template E - The type of event.
 * @template S - The type of state identifier.
 * @param event - The event being handled.
 * @returns The state identifier or void.
 */
type EventHandler<E, C> = (params: {
    event: E;
    context: C;
    setContext: (context: C) => void;
    updateContext: (callback: (context: C) => C) => void;
}) => string | void;
type StateNodeOptions<E extends MachineEvent, C = unknown> = {
    id: string;
    parallel?: boolean;
    context?: C;
    onEntry?: EntryHandler<C>;
    onExit?: ExitHandler<C>;
    on?: {
        [K in E['type']]?: EventHandler<Extract<E, {
            type: K;
        }>, C>;
    };
};
declare class MachineNode<E extends MachineEvent, C = unknown> {
    #private;
    onEntry?: EntryHandler<C>;
    onExit?: ExitHandler<C>;
    onTransition?: TransitionHandler<C>;
    get id(): string;
    get active(): boolean;
    get parallel(): boolean;
    get initialChildId(): string | undefined;
    set initialChildId(value: string | undefined);
    constructor(options: StateNodeOptions<E, C>);
    addChildState(child: MachineNode<E, C>, initial?: boolean): this;
    /**
     * Removes a child state from the current state node.
     *
     * @param child - The child state to remove.
     * @returns The current state node.
     */
    removeChildState(child: MachineNode<E, C>): this;
    /**
     * Appends a child state to the current state node.
     *
     * @param params - The parameters for the child state.
     * @returns The child state node.
     */
    appendChild(params: {
        id: string;
        onEntry?: EntryHandler<C>;
        onExit?: ExitHandler<C>;
        on?: {
            [K in E['type']]?: EventHandler<Extract<E, {
                type: K;
            }>, C>;
        };
        initial?: boolean;
    }): MachineNode<E, C>;
    /**
     * Sets a handler for an event type.
     *
     * @param eventType - The event type to set the handler for.
     * @param handler - The handler to set.
     */
    setTransitionHandler<T extends E['type']>(eventType: T, handler: EventHandler<Extract<E, {
        type: T;
    }>, C>): void;
    /**
     * Dispatches an event to the current state node.
     *
     * @param event - The event to dispatch.
     */
    dispatch(event: E): void;
    transition(targetId: string): Promise<void>;
    enter(): Promise<void>;
    exit(preserveHistory?: 'shallow' | 'deep'): Promise<void>;
    after(ms: number, callback: AfterCallback<C>): void;
    /**
     * Returns all children of the current state node
     *
     * @returns The children of the current state node
     */
    getChildren(): MachineNode<E, C>[];
    /**
     * Returns all active children of the current state node
     *
     * @returns The active children of the current state node
     */
    getActiveChildren(): MachineNode<E, C>[];
    getStateById(id: string, current?: MachineNode<E, C>, excludeId?: string): MachineNode<E, C> | undefined;
    cleanup(): void;
    setContext(context: C): void;
    getContext(): C;
    updateContext(callback: (context: C) => C): void;
    /**
     * Serialises the state of the state machine into a serialised state object.
     *
     * @param state - The state to serialise.
     * @returns The serialised state.
     */
    serialiseState(state?: this): SerialisedState<string>;
}

/**
 * Configuration for a state in the state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template C - The type of context object that is passed to the state machine.
 */
type NodeConfig<E extends MachineEvent, C = unknown> = {
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
     * Designates the initial child state ID.
     * If not specified, defaults to the first child state.
     */
    initial?: string;
    /**
     * Nested state configuration hierarchy.
     */
    states?: Record<string, Partial<NodeConfig<E, C>>>;
    /**
     * Determines state history retention behavior:
     * - shallow: Remembers only immediate child states
     * - deep: Remembers the complete subtree of active states
     */
    history?: 'shallow' | 'deep';
    /**
     * Event handler mappings
     */
    on?: Partial<{
        [K in E['type']]: EventHandler<Extract<E, {
            type: K;
        }>, C>;
    }>;
    /**
     * Entry handler with optional state transition
     */
    onEntry?: EntryHandler<C>;
    /**
     * Exit handler for cleanup operations
     */
    onExit?: ExitHandler<C>;
};
type CoerceNodeConfig<T extends NodeConfig<MachineEvent, unknown>> = {
    initial: keyof T['states'];
    states: {
        [K in keyof T['states']]: T['states'][K] extends NodeConfig<MachineEvent, unknown> ? CoerceNodeConfig<T['states'][K]> : T['states'][K];
    };
};
type ValidateNodeConfig<T extends NodeConfig<MachineEvent, unknown> | object> = T extends never ? T : CoerceNodeConfig<T>;
type RootConfig<E extends MachineEvent, C = unknown> = {
    context: C;
    events: E;
} & ValidateNodeConfig<NodeConfig<E, C>>;
/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 *
 * @param config - The configuration object for the state machine.
 * @returns A new state machine.
 */
declare function machineFactory<E extends MachineEvent, C>(config: RootConfig<E, C>): MachineNode<E, C>;

export { machineFactory };
