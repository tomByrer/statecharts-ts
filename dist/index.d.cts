type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';
type AfterHandler<C, S extends string> = (stateName: S, ms: number, callback?: ({ context }: {
    context?: C;
}) => void) => void;
type EntryHandler<C, S extends string> = (params: {
    transitionAfter: AfterHandler<C, S>;
    context: C;
    updateContext: (context: Partial<C>) => void;
}) => void;
type ExitHandler<C> = (params: {
    context?: C;
    updateContext: (context: Partial<C>) => void;
}) => void;
type MachineEvent = {
    type: string;
    data?: unknown;
};
type EventHandler<E extends MachineEvent, C, S extends string> = (params: {
    event: E;
    context: C;
    updateContext: (context: Partial<C>) => void;
}) => S;
type MachineConfig<E extends MachineEvent, C, S extends string> = {
    events?: E;
    type?: StateType;
    states?: Partial<{
        [K in S]: MachineConfig<E, C, S>;
    }>;
    on?: {
        [K in E['type']]?: EventHandler<Extract<E, {
            type: K;
        }>, C, S>;
    };
    onEntry?: EntryHandler<C, S>;
    onExit?: ExitHandler<C>;
};
type StateObject = {
    [key: string]: StateObject | string | null;
};
type MachineState = StateObject | string | null;

/**
 * Root class for managing a hierarchical state machine.
 *
 * @template E - The type of events that the state machine can handle
 * @template C - The type of the context object
 * @template S - The type of state names (must extend string)
 */
declare class StateMachineRoot<E extends MachineEvent, C, S extends string> {
    private config;
    private subscriptions;
    private state;
    private context;
    private isRunning;
    private stateMap;
    constructor(config: RootStateDefinition<E, C>);
    /**
     * Starts the state machine.
     * Initializes the state machine and notifies subscribers if not already running.
     */
    start(): void;
    /**
     * Stops the state machine and performs cleanup.
     */
    stop(): void;
    /**
     * Updates the context object with new values.
     * @param context - Partial context object to merge with existing context
     */
    updateContext(context: Partial<C>): void;
    /**
     * Subscribes to state machine updates.
     * @param handler - Callback function that receives current state and context
     * @returns Unsubscribe function
     */
    subscribe(handler: (state: MachineState, context: C) => void): () => void;
    /**
     * Unsubscribes a handler from state machine updates.
     * @param handler - The handler function to remove
     */
    unsubscribe(handler: (state: MachineState, context: C) => void): void;
    /**
     * Notifies all subscribers of the current state and context.
     */
    notifySubscribers(): void;
    /**
     * Returns the current state of the state machine.
     * @returns Current machine state
     */
    getState(): MachineState;
    /**
     * Returns the current context object.
     * @returns Current context
     */
    getContext(): C;
    /**
     * Sends an event to the state machine for processing.
     * @param event - The event to process
     * @throws Error if state machine is not running
     */
    send(event: E): void;
}

/**
 * Defines the root state configuration for a state machine.
 *
 * @template C - The type of the context object that can be passed to state handlers.
 * * It can be 'sequential' or 'parallel', but not 'leaf' or 'initial'.
 *
 * @property {Record<string, StateDefinition<C>>} states - A record of state definitions
 * where each key is a state name and the value is its corresponding state definition.
 *
 * @property {MachineEvent[]} events - An array of events that the state machine can handle.
 *
 * @property {C} [context] - An optional context object that can be used to store
 * and pass data between states and event handlers.
 */
type RootStateDefinition<E extends MachineEvent, C> = MachineConfig<E, C, string> & {
    context: C;
};
/**
 * Factory function to create a state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template C - The type of the context object that can be passed to state handlers.
 *
 * @param {RootStateDefinition<E, C>} config - The configuration for the state machine.
 * @returns {Machine<E, C, string>} An object with methods to get the state and send events.
 */
declare function machineFactory<E extends MachineEvent, C>(config: RootStateDefinition<E, C>): Machine<E, C, string>;
/**
 * Represents a state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template C - The type of the context object that can be passed to state handlers.
 * @template S - The type of the state string.
 */
type Machine<E extends MachineEvent, C, S extends string> = StateMachineRoot<E, C, S>;

export { machineFactory };
