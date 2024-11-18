import { MachineConfig } from './StateMachine';
import { StateMachineRoot } from './StateMachineRoot';

export type RootStateDefinition<
  E extends MachineEvent,
  C,
  S extends string,
> = MachineConfig<E, C, S> & {
  context: C;
};

export function machineFactory<E extends MachineEvent, C, S extends string>(
  config: RootStateDefinition<E, C, S>,
) {
  return new StateMachineRoot(config);
}

export type Machine<
  E extends MachineEvent,
  C,
  S extends string,
> = StateMachineRoot<E, C, S>;
