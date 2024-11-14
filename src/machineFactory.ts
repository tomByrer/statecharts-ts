import { StateType, MachineEvent, MachineConfig } from './stateMachine';
import { StateMachineRoot } from './stateMachineRoot';

/**
 * Defines the root state configuration for a state machine.
 *
 * @template C - The type of the context object that can be passed to state handlers.
 *
 * @property {Exclude<StateType, 'leaf' | 'initial'>} [type] - The type of the root state.
 * It can be 'sequential' or 'parallel', but not 'leaf' or 'initial'.
 *
 * @property {Record<string, StateDefinition<C>>} states - A record of state definitions
 * where each key is a state name and the value is its corresponding state definition.
 *
 * @property {MachineEvent[]} events - An array of events that the state machine can handle.
 *
 * @property {C} [context] - An optional context object that can be used to store
 * and pass data between states and event handlers.
 */
export type RootStateDefinition<
  E extends MachineEvent,
  C extends any
> = MachineConfig<E, C, string> & {
  context: C;
};
/**
 * Factory function to create a state machine.
 * @param config - The configuration for the state machine.
 * @returns An object with methods to get the state and send events.
 */

export function machineFactory<E extends MachineEvent, C extends any>(
  config: RootStateDefinition<E, C>
): Machine<E, C, string> {
  return new StateMachineRoot(config);
}

export type Machine<
  E extends MachineEvent,
  C extends any,
  S extends string
> = StateMachineRoot<E, C, S>;
