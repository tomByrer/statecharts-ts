import { MachineEvent, MachineNode, StateNodeOptions } from './MachineNode';
import { Subscription } from './Subscription';

type StateConfigNode<E extends MachineEvent, C extends object> = {
  states: Record<string, Partial<StateConfigNode<E, C>>>;
} & StateNodeOptions<E, C>;

type CoerceStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateConfigNode<E, C>,
> = {
  initial: keyof T['states'];
  states: {
    [K in keyof T['states']]: T['states'][K] extends StateConfigNode<E, C>
      ? CoerceStateNode<E, C, T['states'][K]>
      : T['states'][K];
  };
};

type ValidateStateNode<
  E extends MachineEvent,
  C extends object,
  T extends StateConfigNode<E, C>,
> = T extends never ? T : CoerceStateNode<E, C, T>;

export function machineFactory<E extends MachineEvent, C extends object>(
  config: ValidateStateNode<E, C, StateConfigNode<E, C>> & {
    events: E;
  },
) {
  const subscription = new Subscription();
  const { subscribe } = subscription;

  const {
    active,
    dispatch,
    enter: start,
    exit: stop,
  } = new MachineNode<E, C>({ id: 'root', ...config });

  return {
    active,
    dispatch,
    start,
    stop,
    subscribe,
  };
}
