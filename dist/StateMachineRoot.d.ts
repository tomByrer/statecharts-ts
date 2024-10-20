import { RootStateDefinition } from './machineFactory';
import { MachineState, MachineEvent } from './StateMachine';
/**
 * Class representing the root state machine.
 * @template C - The type of the context object.
 */
export declare class StateMachineRoot<C> {
    private config;
    private subscriptions;
    private state;
    private context;
    constructor(config: RootStateDefinition<C>);
    updateContext(context: Partial<C>): void;
    subscribe(handler: (state: MachineState, context: C) => void): () => void;
    unsubscribe(handler: (state: MachineState, context: C) => void): void;
    notifySubscribers(): void;
    getState(): MachineState;
    getContext(): C;
    send(event: MachineEvent): void;
}
