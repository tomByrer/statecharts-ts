import { ValidateStateNode, StateConfigNode } from './machineFactory';
import { MachineEvent, MachineNode } from './MachineNode';
import { Subscription } from './Subscription';

export class Machine<E extends MachineEvent, C extends object> {
  #machine: MachineNode<E, C>;
  #subscription: Subscription;

  constructor(
    config: ValidateStateNode<E, C, StateConfigNode<E, C>> & {
      events: E;
      context?: C;
    },
  ) {
    this.#machine = new MachineNode<E, C>({ id: 'root', ...config });
    this.#subscription = new Subscription();
  }

  start() {
    this.#machine.enter();
  }

  stop() {
    this.#machine.exit();
  }

  dispatch(event: E) {
    this.#machine.dispatch(event);
  }

  subscribe(handler: (state: string) => void) {
    return this.#subscription.subscribe(handler);
  }
}
