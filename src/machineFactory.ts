import { StateMachine } from './StateMachine';

import { MachineEvent } from './StateNode';
import { RootConfig } from './StateMachine';

/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 *
 * @param config - The configuration object for the state machine.
 * @returns A new state machine.
 */
export function machineFactory<E extends MachineEvent, C>(
  config: RootConfig<E, C>,
) {
  const {
    getContext,
    getState,
    send,
    start,
    stop,
    subscribe,
    unsubscribe,
    serialise,
  } = new StateMachine<E, C>(config);

  return {
    getContext,
    getState,
    send,
    start,
    stop,
    subscribe,
    unsubscribe,
    serialise,
  };
}
