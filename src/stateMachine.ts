import { EventBus } from './EventBus';

export type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';

type AfterCallback<S> = () => S;

type EntryHandler<S extends string> = (params: {
  after: (ms: number, callback: AfterCallback<S>) => S;
}) => void;

type ExitHandler = () => void;

// type TransitionHandler<S extends string> = (
//   machineState: MachineState<S>,
// ) => void;

export type MachineEvent = {
  type: string;
  data?: unknown;
};

type EventHandler<E extends MachineEvent, S extends string> = (params: {
  event: E;
}) => S | null;

export type MachineConfig<E extends MachineEvent, S extends string> = {
  events?: E;
  type?: StateType;
  states?: Partial<{
    [K in S]: MachineConfig<E, S>;
  }>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, S>;
  };
  onEntry?: EntryHandler<S>;
  onExit?: ExitHandler;
};

// export type StateObject = {
//   [key: string]: StateObject | string | null;
// };

// export type MachineState = StateObject | string | null;

export type MachineState<S extends string> =
  | {
      [K in S]?: MachineState<S> | null;
    }
  | null;

export class StateMachine<E extends MachineEvent, S extends string> {
  private stateName: S | null = null;
  private states: Record<S, StateMachine<E, S>> | null = null;
  private type: StateType;
  private onEntry?: EntryHandler<S>;
  private onExit?: ExitHandler;
  private activeStateName: S | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  private config: MachineConfig<E, S>;
  private parentState?: StateMachine<E, S>;
  private stateRegistry: Map<S, StateMachine<E, S>>;
  private eventBus: EventBus<E>;
  private eventUnsubscribers: (() => void)[] = [];
  private onTransition?: () => void;

  constructor(
    config: MachineConfig<E, S>,
    options: {
      parentState?: StateMachine<E, S>;
      stateName?: S;
      onTransition?: () => void;
    },
  ) {
    this.config = config;
    this.type = config.states ? (config.type ?? 'sequential') : 'leaf';
    this.onEntry = config.onEntry as EntryHandler<S>;
    this.onExit = config.onExit;
    this.parentState = options.parentState;
    this.stateRegistry = this.parentState?.stateRegistry ?? new Map();
    this.eventBus = this.parentState?.eventBus ?? new EventBus();
    this.stateName = options.stateName ?? null;
    this.onTransition = options.onTransition;

    // If there are child states, create them
    if (this.config.states) {
      const stateKeys = Object.keys(this.config.states);
      let initialState = stateKeys[0] as S;

      // Create all states
      for (const stateName of stateKeys) {
        const stateConfig = this.config.states[stateName as S]!;
        // Create the state
        const state = new StateMachine<E, S>(stateConfig, {
          parentState: this,
          stateName: stateName as S,
          onTransition: this.onTransition,
        });

        this.stateRegistry.set(stateName as S, this);

        if (!this.states) {
          this.states = {} as Record<S, StateMachine<E, S>>;
        }

        this.states[stateName as S] = state;

        if (this.type !== 'sequential') {
          continue;
        }

        if (stateConfig.type === 'initial') {
          // It is illegal to have more than one initial state
          if (initialState) {
            throw new Error('Multiple initial states found');
          }
          initialState = stateName as S;
        }
      }

      this.setActiveStateName(initialState);
    }
  }
  private handleEvent(event: E): void {
    const callback = this.config.on?.[event.type as E['type']];

    if (callback) {
      let activeStateName = callback({
        event: event as Extract<E, { type: E['type'] }>,
      });

      if (activeStateName) {
        let parentState = this.stateRegistry.get(activeStateName);

        while (parentState && parentState.activeStateName !== activeStateName) {
          parentState.getActiveState()?.exit();
          parentState.setActiveStateName(activeStateName!);
          parentState.getActiveState()?.enter();
          activeStateName = parentState.stateName;
          parentState = parentState.parentState;
        }

        this.onTransition?.();
      }
    }
  }

  enter(): void {
    if (this.onEntry) {
      this.onEntry({
        after: this.after.bind(this),
      });
    }

    if (this.config.on) {
      for (const eventType in this.config.on) {
        const eventSubscription = this.eventBus.on(eventType, (event: E) => {
          this.handleEvent(event);
        });

        this.eventUnsubscribers.push(eventSubscription);
      }
    }

    if (this.type === 'sequential' && this.states) {
      const state = this.states[this.activeStateName as S];

      state.enter();
    }
  }

  exit(): void {
    // this.parentState?.setActiveChildState(null);

    // Clear event handlers before exiting state
    for (const unsubscribe of this.eventUnsubscribers) {
      unsubscribe();
    }

    this.eventUnsubscribers = [];

    if (this.type === 'sequential' && this.states) {
      const state = this.states[this.activeStateName as S];

      state.exit();
    } else if (this.type === 'parallel') {
      for (const stateName in this.states) {
        this.states[stateName].exit();
      }
    }

    this.onExit?.();
  }

  setActiveStateName(stateName: S) {
    if (!this.states?.[stateName]) {
      throw new Error('State not found');
    }

    this.activeStateName = stateName;
  }

  getActiveState() {
    return this.states?.[this.activeStateName as S];
  }

  after(ms: number, callback: AfterCallback<S>) {
    const timer = setTimeout(() => {
      const stateName = callback?.();
      const parentState = this.stateRegistry.get(stateName);

      if (!parentState) {
        throw new Error('State not found');
      }

      parentState.setActiveStateName(stateName);
    }, ms);

    this.timers.push(timer);

    return this.activeStateName as S;
  }

  send(event: E): void {
    this.eventBus.send(event);
  }

  getState(): MachineState<S> {
    if (this.states) {
      if (this.type === 'sequential') {
        const childState = this.states[this.activeStateName as S];

        if (childState.type === 'leaf') {
          return this.activeStateName;
        }

        return {
          [this.activeStateName as S]: childState.getState(),
        } as MachineState<S>;
      }

      const stateEntries: [S, MachineState<S>][] = [];

      for (const stateName in this.states) {
        stateEntries.push([stateName, this.states[stateName].getState()]);
      }

      return Object.fromEntries(stateEntries) as MachineState<S>;
    }

    return null;
  }
}
