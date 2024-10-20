import { Machine } from '../machineFactory';
export declare function useMachine<C extends any>(machine: Machine<C>): {
    state: string | import("../StateMachine").StateObject | null;
    context: C;
    send: (event: import("../StateMachine").MachineEvent) => void;
};
