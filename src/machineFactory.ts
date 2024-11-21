import { StateMachineRoot, RootStateDefinition } from './StateMachineRoot';

export function machineFactory<E extends MachineEvent, S extends string>(
  config: RootStateDefinition<E, S>,
) {
  return new StateMachineRoot(config);
}

export type Machine<
  E extends MachineEvent,
  S extends string,
> = StateMachineRoot<E, S>;
