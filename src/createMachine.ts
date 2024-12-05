// import { Machine } from './Machine';
import {
  EntryHandler,
  EventHandler,
  ExitHandler,
  MachineEvent,
} from './MachineNode';

import { Machine } from './Machine';

export type StateNode<E extends MachineEvent, C extends object> = {
  id?: string;
  events: E;
  context: C;
  initial: string;
  states: Record<string, Partial<StateNode<E, C>>>;
  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
  };
};

type CoerceStateNode<C extends object, T extends StateNode<MachineEvent, C>> = {
  id: T['id'];
  events: T['events'];
  context: C;
  initial: keyof T['states'];
  states: {
    [K in keyof T['states']]: T['states'][K] extends StateNode<MachineEvent, C>
      ? CoerceStateNode<C, T['states'][K]>
      : T['states'][K];
  };
  onEntry?: T['onEntry'];
  onExit?: T['onExit'];
  on?: T['on'];
};

export type ValidateStateNode<
  C extends object,
  T extends StateNode<MachineEvent, C>,
> = T extends never ? T : CoerceStateNode<C, T>;

export function createMachine<
  C extends object,
  T extends StateNode<MachineEvent, C>,
>(config: ValidateStateNode<C, T>) {
  const machine = new Machine(config);

  return machine;
}
