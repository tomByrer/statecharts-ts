import { MachineEvent } from './State';
import { StateConfig, StateMachine } from './StateMachine';

export function machineFactory<E extends MachineEvent>(config: StateConfig<E>) {
  return new StateMachine(config);
}
