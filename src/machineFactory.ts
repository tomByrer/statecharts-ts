import { MachineConfig } from './StateMachine';
import { StateMachineRoot } from './StateMachineRoot';

export type RootStateDefinition<
  E extends MachineEvent,
  S extends string,
> = MachineConfig<E, S>;

export function machineFactory<E extends MachineEvent, S extends string>(
  config: RootStateDefinition<E, S>,
) {
  return new StateMachineRoot(config);
}

export type Machine<
  E extends MachineEvent,
  S extends string,
> = StateMachineRoot<E, S>;
