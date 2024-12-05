import { ValidateStateNode, StateNode } from './createMachine';
import { MachineEvent, MachineNode } from './MachineNode';
import { Subscription } from './Subscription';

export class Machine<C extends object, T extends StateNode<MachineEvent, C>> {
  #machine: MachineNode<T['events'], C>;
  #subscription: Subscription;

  constructor(config: ValidateStateNode<C, T>) {
    this.#machine = new MachineNode<T['events'], C>(config);
    this.#subscription = new Subscription();
  }

  start() {
    this.#machine.enter();
  }

  stop() {
    this.#machine.exit();
  }

  dispatch(event: T['events']) {
    this.#machine.dispatch(event);
  }

  subscribe(handler: (state: string) => void) {
    return this.#subscription.subscribe(handler);
  }
}
