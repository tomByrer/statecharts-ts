// StateMachine.ts

import {
  State,
  MachineEvent,
  EntryHandler,
  ExitHandler,
  EventHandler,
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
  onEntry?: EntryHandler<S>;
  onExit?: ExitHandler;
};

type StateChangeHandler<X> = (state: SerialisedState<X>) => void;

export type StateRegistry<E extends MachineEvent, S extends string> = Map<
  S,
  State<E, S>
>;

export type MachineContext<E extends MachineEvent, S extends string> = {
  stateRegistry: StateRegistry<E, S>;
  notifyListeners: () => void;
};

export type SerialisedState<S extends string> =
  | S
  | { [key: string]: SerialisedState<S> };

export class StateMachine<E extends MachineEvent, S extends string> {
  private listeners: StateChangeHandler<S>[];
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
      notifyListeners: () => this.notifyListeners(this.rootState),
    };

    const state = new State<E, S>(parent, id, machineContext);

    state.parallel = config.parallel ?? false;
    state.onEntry = config.onEntry;
    state.onExit = config.onExit;
    state.initial = config.initial ?? false;

    for (const event in config.on) {
      const handler = config.on[event as E['type']]!;

      state.on(event, handler);
    }

    if (config.states) {
      const stateEntries = Object.entries(config.states);

      for (const [childId, childConfig] of stateEntries) {
        const childState = this.buildState(childConfig!, state, childId as S);

        state.addChild(childState);
      }
    }

    return state;
  }

  getStateById(id: S) {
    return this.stateRegistry.get(id);
  }

  subscribe(handler: StateChangeHandler<S>) {
    this.listeners.push(handler);
  }

  unsubscribe(handler: StateChangeHandler<S>) {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  notifyListeners(state: State<E, S>) {
    const serialisedState = this.serialise(state);

    for (const handler of this.listeners) {
      handler(serialisedState);
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

  value(): SerialisedState<S> {
    return this.serialise(this.rootState);
  }

  send(event: E) {
    if (!this.isRunning) {
      throw new Error('State machine is not running');
    }

    this.rootState.notifyListeners(event);
  }

  serialise(state: State<E, S>): SerialisedState<S> {
    const activeChildren = state.getActiveChildren();

    if (activeChildren.length === 1) {
      return activeChildren[0].id as unknown as S;
    }

    return state.getActiveChildren().reduce((acc, state) => {
      acc[state.id] = this.serialise(state) as S;

      return acc;
    }, {} as SerialisedState<S>);
  }
}
