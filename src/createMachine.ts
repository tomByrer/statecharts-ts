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
  context: C;
  initial?: string;
  states: Record<string, Partial<StateNode<E, C>>>;
  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
  };
};

type CoerceStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateNode<E, C>,
> = {
  id?: string;
  context: C;
  events: E;
  initial: keyof T['states'];
  states: {
    [K in keyof T['states']]: T['states'][K] extends StateNode<E, C>
      ? CoerceStateNode<E, C, T['states'][K]>
      : T['states'][K];
  };
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
  };
};

export type ValidateStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateNode<E, C>,
> = T extends never ? T : CoerceStateNode<E, C, T>;

export function createMachine<
  C extends object,
  T extends StateNode<MachineEvent, C>,
>(config: ValidateStateNode<MachineEvent, C, T>) {
  const machine = new Machine(config);

  return machine;
}
