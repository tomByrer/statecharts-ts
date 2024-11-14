import { MachineEvent, MachineConfig } from './stateMachine';
import { StateMachineRoot } from './stateMachineRoot';

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
export type RootStateDefinition<E extends MachineEvent, C> = MachineConfig<
  E,
  C,
  string
> & {
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
export function machineFactory<E extends MachineEvent, C>(
  config: RootStateDefinition<E, C>,
): Machine<E, C, string> {
  return new StateMachineRoot(config);
}

/**
 * Represents a state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template C - The type of the context object that can be passed to state handlers.
 * @template S - The type of the state string.
 */
export type Machine<
  E extends MachineEvent,
  C,
  S extends string,
> = StateMachineRoot<E, C, S>;
