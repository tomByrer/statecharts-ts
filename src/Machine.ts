import { ValidateStateNode, StateNode } from './createMachine';
import { MachineEvent, MachineNode } from './MachineNode';
import { Subscription } from './Subscription';

export class Machine<
  E extends MachineEvent,
  C extends object,
  T extends StateNode<E, C>,
> {
  #machine: MachineNode<E, C>;
  #subscription: Subscription;

  constructor(config: ValidateStateNode<E, C, T>) {
    this.#machine = new MachineNode<E, C>(config);
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
