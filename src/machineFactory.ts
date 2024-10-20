import { StateMachine } from './StateMachine';

import { MachineEvent } from './State';
import { RootConfig } from './StateMachine';
/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 *
 * @param config - The configuration object for the state machine.
 * @returns A new state machine.
 */
export function machineFactory<
  E extends MachineEvent,
  C,
  S extends string = string,
>(config: RootConfig<E, S, C>) {
  return new StateMachine<E, S, C>(config);
}
