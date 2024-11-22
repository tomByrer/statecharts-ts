import {
  State,
  MachineEvent,
  EntryHandler,
  ExitHandler,
  EventHandler,
} from './State';

export type StateConfig<E extends MachineEvent> = {
  events?: E;
  parallel?: boolean;
  initial?: boolean;
  states?: Partial<{
    [K in string]: StateConfig<E>;
  }>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>>;
  };
  onEntry?: EntryHandler;
  onExit?: ExitHandler;
};

type StateChangeHandler<E extends MachineEvent> = (state: State<E>) => void;

export class StateMachine<E extends MachineEvent> {
  private listeners: StateChangeHandler<E>[];

  rootState: State<E>;

  get isRunning() {
    return this.rootState.active;
  }

  constructor(rootConfig: StateConfig<E>) {
    this.listeners = [];
    this.rootState = this.buildState(rootConfig, null, 'root');
  }

  buildState(
    config: StateConfig<E>,
    parent: State<E> | null,
    id: string = 'root',
  ) {
    const state = new State<E>(parent, id);

    state.parallel = config.parallel ?? false;
    state.onEntry = config.onEntry;
    state.onExit = config.onExit;

    for (const event in config.on) {
      const handler = config.on[event as E['type']]!;
      state.on(event, handler);
    }

    if (config.states) {
      const stateEntries = Object.entries(config.states);

      for (const [childId, childConfig] of stateEntries) {
        const childState = this.buildState(childConfig!, state, childId);

        if (childState.initial) {
          childState.initial = true;
        }

        state.addChild(childState);
      }
    }

    return state;
  }

  subscribe(handler: StateChangeHandler<E>) {
    this.listeners.push(handler);
  }

  unsubscribe(handler: StateChangeHandler<E>) {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  notifyListeners(state: State<E>) {
    for (const handler of this.listeners) {
      handler(state.serialise());
    }
  }

  public start() {
    if (this.isRunning) {
      return;
    }

    this.rootState.enter();
    this.notifyListeners(this.rootState);
  }

  public stop() {
    this.rootState.exit();
  }

  value() {
    return this.rootState.serialise();
  }

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.rootState.notifyListeners(event);
  }
}
