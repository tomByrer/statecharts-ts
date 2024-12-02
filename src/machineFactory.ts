import { MachineEvent, MachineNode, StateNodeOptions } from './MachineNode';

type StateConfigNode = {
  states: Record<string, Partial<StateConfigNode>>;
} & StateNodeOptions<MachineEvent, object>;

type CoerceStateNode<T extends StateConfigNode> = {
  initial: keyof T['states'];
  states: {
    [K in keyof T['states']]: T['states'][K] extends StateConfigNode
      ? CoerceStateNode<T['states'][K]>
      : T['states'][K];
  };
};

type ValidateStateNode<T extends StateConfigNode> = T extends never
  ? T
  : CoerceStateNode<T>;

export function machineFactory<E extends MachineEvent, C extends object>(
  config: ValidateStateNode<StateConfigNode>,
) {
  return new MachineNode<E, C>({ id: 'root', ...config });
}
