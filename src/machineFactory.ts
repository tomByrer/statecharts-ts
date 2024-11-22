// machineFactory.ts
import { MachineEvent } from './State';
import { StateConfig, StateMachine } from './StateMachine';

export function machineFactory<E extends MachineEvent, S extends string>(
  config: StateConfig<E, S>,
) {
  return new StateMachine<E, S>(config);
}
