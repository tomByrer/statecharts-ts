import {
  State,
  MachineEvent,
  EntryHandler,
  ExitHandler,
  EventHandler,
  SerialisedState,
  StateHierarchy,
} from './State';

export type StateConfig<E extends MachineEvent, S extends string> = {
  events?: E;
  parallel?: boolean;
  initial?: boolean;
  states?: Partial<{
    [K in string]: StateConfig<E, S>;
  }>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, S>;
  };
  onEntry?: EntryHandler;
  onExit?: ExitHandler;
};

type StateChangeHandler<X> = (state: SerialisedState<X>) => void;

export type StateRegistry<E extends MachineEvent, S extends string> = Map<
  S,
  State<E, S>
>;

export type MachineContext<E extends MachineEvent, S extends string> = {
  stateRegistry: StateRegistry<E, S>;
};

export class StateMachine<
  E extends MachineEvent,
  S extends string,
  X extends StateHierarchy,
> {
  private listeners: StateChangeHandler<X>[];
  private stateRegistry: StateRegistry<E, S> = new Map();

  rootState: State<E, S>;

  get isRunning() {
    return this.rootState.active;
  }

  constructor(rootConfig: StateConfig<E, S>) {
    this.listeners = [];
    this.rootState = this.buildState(rootConfig, null, 'root' as S);
  }

  buildState(config: StateConfig<E, S>, parent: State<E, S> | null, id: S) {
    const machineContext: MachineContext<E, S> = {
      stateRegistry: this.stateRegistry,
    };

    const state = new State<E, S>(parent, id, machineContext);

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
        const childState = this.buildState(childConfig!, state, childId as S);

        if (childState.initial) {
          childState.initial = true;
        }

        state.addChild(childState);
      }
    }

    return state;
  }

  getStateById(id: S) {
    return this.stateRegistry.get(id);
  }

  subscribe(handler: StateChangeHandler<X>) {
    this.listeners.push(handler);
  }

  unsubscribe(handler: StateChangeHandler<X>) {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  notifyListeners(state: State<E, S>) {
    for (const handler of this.listeners) {
      handler(state.serialise<X>());
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

  value(): SerialisedState<X> {
    return this.rootState.serialise<X>();
  }

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.rootState.notifyListeners(event);
  }
}
