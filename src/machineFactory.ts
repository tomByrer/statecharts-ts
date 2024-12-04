import { Machine } from './Machine';
import { EventHandler, MachineEvent, StateNodeOptions } from './MachineNode';

export type StateConfigNode<E extends MachineEvent, C extends object> = {
  states: Record<string, Partial<StateConfigNode<E, C>>>;
} & StateNodeOptions<E, C>;

type CoerceStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateConfigNode<E, C>,
> = {
  initial: keyof T['states'];
  on?: Record<E['type'], EventHandler<E, C>>;
  states: {
    [K in keyof T['states']]: T['states'][K] extends StateConfigNode<E, C>
      ? CoerceStateNode<E, C, T['states'][K]>
      : T['states'][K];
  };
};

export type ValidateStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateConfigNode<E, C>,
> = T extends never ? T : CoerceStateNode<E, C, T>;

export function machineFactory<E extends MachineEvent, C extends object>(
  config: ValidateStateNode<E, C, StateConfigNode<E, C>> & {
    id?: string;
    events: E;
    context?: C;
  },
) {
  const machine = new Machine<E, C>(config);

  return machine;
}
