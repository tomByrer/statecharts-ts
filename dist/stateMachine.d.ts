/**
 * Represents the possible types of states in the state machine.
 *
 * - 'initial': The starting state of a sequential state machine.
 * - 'sequential': A state that has a single active child state at a time.
 * - 'parallel': A state that can have multiple active child states simultaneously.
 * - 'leaf': A terminal state with no child states.
 */
export type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';
/**
 * Represents an event that can be processed by the state machine.
 *
 * @property {string} type - The type of the event, used to determine the appropriate handler.
 * @property {any} [data] - Optional data associated with the event.
 */
export type MachineEvent = {
    type: string;
    data?: any;
};
/**
 * Defines the type for event handlers that manage state transitions.
 *
 * @template C - The type of the context object that can be passed to the handler.
 *
 * @param {MachineEvent} event - The event triggering the transition.
 * @param {(stateName: string) => void} transition - Function to transition to a new state.
 * @param {C} [context] - Optional context object for additional data.
 */
type EventHandler<C = any> = ({ event, transition, context, }: {
    event: MachineEvent;
    transition: (stateName: string) => void;
    context: C;
}) => void;
/**
 * Defines the type for handlers that transition to a new state after a delay.
 *
 * @template C - The type of the context object that can be passed to the handler.
 *
 * @param {string} stateName - The name of the state to transition to.
 * @param {number} ms - The delay in milliseconds before the transition occurs.
 * @param {({ context }: { context?: C }) => void} [callback] - Optional callback executed after the delay.
 */
type TransitionAfterHandler<C = any> = (stateName: string, ms: number, callback?: ({ context }: {
    context?: C;
}) => void) => void;
/**
 * Defines the type for entry handlers executed when entering a state.
 *
 * @template C - The type of the context object that can be passed to the handler.
 *
 * @param {TransitionAfterHandler<C>} transitionAfter - Function to schedule a delayed state transition.
 * @param {C} [context] - Optional context object for additional data.
 */
type EntryHandler<C = any> = ({ transitionAfter, context, }: {
    transitionAfter: TransitionAfterHandler<C>;
    context: C;
    updateContext: (context: Partial<C>) => void;
}) => void;
/**
 * Defines the type for exit handlers executed when exiting a state.
 *
 * @template C - The type of the context object that can be passed to the handler.
 *
 * @param {C} [context] - Optional context object for additional data.
 */
type ExitHandler<C = any> = ({ context, updateContext, }: {
    context?: C;
    updateContext: (context: Partial<C>) => void;
}) => void;
/**
 * Describes the structure of a state within the state machine.
 *
 * @template C - The type of the context object that can be passed to state handlers.
 *
 * @property {StateType} [type] - The type of the state, determining its behavior.
 * @property {Record<string, StateDefinition<C>>} [states] - Nested states within this state.
 * @property {Record<string, EventHandler<C>>} [on] - Event handlers for state transitions.
 * @property {EntryHandler<C>} [onEntry] - Handler executed upon entering the state.
 * @property {ExitHandler<C>} [onExit] - Handler executed upon exiting the state.
 */
export type StateDefinition<C = any> = {
    type?: StateType;
    states?: Record<string, StateDefinition<C>>;
    on?: Record<string, EventHandler<C>>;
    onEntry?: EntryHandler<C>;
    onExit?: ExitHandler<C>;
};
/**
 * Represents a state object in the state machine.
 */
export type StateObject = {
    [key: string]: StateObject | string | null;
};
/**
 * Represents the possible states in the state machine.
 */
export type MachineState = StateObject | string | null;
/**
 * Represents the parent state of a state machine.
 */
type ParentState = {
    name: string;
    transition: (stateName: string) => void;
    getPathToState: () => string[];
    onTransition: (stateName: string) => void;
};
type RootState<C> = {
    context: C;
    updateContext: (context: Partial<C>) => void;
};
/**
 * Class representing a state machine.
 */
export declare class StateMachine<C> {
    private stateDef;
    private parentState;
    private rootState;
    name: string;
    private activeStates;
    private states;
    private timers;
    readonly type: StateType;
    readonly onEntry?: EntryHandler<C>;
    readonly onExit?: ExitHandler<C>;
    /**
     * Creates an instance of the StateMachine.
     * @param stateDef - The state definition for the machine.
     * @param parentState - The parent state, if any.
     * @param context - The context for the state machine.
     */
    constructor(stateDef: StateDefinition<C>, parentState: ParentState, rootState: RootState<C>);
    /**
     * Initializes the states of the state machine.
     * Sets up the initial active states based on the state type.
     */
    private initializeStates;
    /**
     * Gets the current state of the state machine.
     * @returns The current state object or null.
     */
    getState(): MachineState;
    /**
     * Gets the path to the current state.
     * @returns An array representing the path to the current state.
     */
    private getPathToState;
    /**
     * Transitions to a new state.
     * @param stateName - The name of the state to transition to.
     */
    transition(stateName: string): void;
    /**
     * Sends an event to the state machine.
     * @param event - The event to send.
     */
    send(event: MachineEvent): void;
    /**
     * Transitions to a new state after a delay.
     * @param stateName - The name of the state to transition to.
     * @param ms - The delay in milliseconds.
     * @param callback - Optional callback to execute after the delay.
     */
    transitionAfter(stateName: string, ms: number, callback?: ({ context }: {
        context?: C;
    }) => void): void;
    /**
     * Disposes of the current state and cleans up resources.
     */
    dispose(): void;
}
export {};
