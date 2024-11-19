import { EventBus } from './EventBus';

export type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';

type AfterCallback<S> = () => S;

type EntryHandler<S extends string> = (params: {
  after: (ms: number, callback: AfterCallback<S>) => S;
}) => void;

type ExitHandler = () => void;

type TransitionHandler<S extends string> = (
  machineState: MachineState<S>,
) => void;

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

export type MachineContext<E extends MachineEvent, S extends string> = {
  eventBus: EventBus<E>;
  onTransition?: TransitionHandler<S>;
};

export type MachineState<S extends string> =
  | {
      [K in S]?: MachineState<S> | null;
    }
  | null;

export class StateMachine<E extends MachineEvent, S extends string> {
  private states: Record<S, StateMachine<E, S>> = {} as Record<
    S,
    StateMachine<E, S>
  >;
  private type: StateType;
  private onEntry?: EntryHandler<S>;
  private onExit?: ExitHandler;
  private activeState: S | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private parentState?: StateMachine<E, S>;

  private config: MachineConfig<E, S>;
  private machineContext: MachineContext<E, S>;
  private eventUnsubscribers: (() => void)[] = [];

  constructor(
    config: MachineConfig<E, S>,
    machineContext: MachineContext<E, S>,
    parentState?: StateMachine<E, S>,
  ) {
    this.config = config;
    this.type = config.states ? (config.type ?? 'sequential') : 'leaf';
    this.onEntry = config.onEntry as EntryHandler<S>;
    this.onExit = config.onExit;
    this.machineContext = machineContext;
    this.parentState = parentState;

    // If there are child states, create them
    if (this.config.states) {
      const stateKeys = Object.keys(this.config.states);
      let initialState: S | null = null;

      // Create all states
      for (const stateName of stateKeys) {
        const stateConfig = this.config.states[stateName as S]!;
        // Create the state
        this.states[stateName as S] = new StateMachine<E, S>(
          stateConfig,
          this.machineContext,
          this,
        );

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

      this.activeState = initialState ?? (stateKeys[0] as S);
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
        const callback = this.config.on[eventType as E['type']];

        if (callback) {
          const handler = (event: E) => {
            const newState = callback({
              event: event as Extract<E, { type: typeof eventType }>,
            });

            if (newState) {
              this.parentState?.transition(newState);
            }
          };

          const eventSubscription = this.machineContext.eventBus.on(
            eventType,
            handler,
          );

          this.eventUnsubscribers.push(eventSubscription);
        }
      }
    }

    if (this.type === 'sequential') {
      const state = this.states[this.activeState as S];

      state.enter();
    }
  }

  exit(): void {
    // Clear event handlers before exiting state
    for (const unsubscribe of this.eventUnsubscribers) {
      unsubscribe();
    }
    this.eventUnsubscribers = [];

    if (this.type === 'sequential' && this.activeState) {
      const state = this.states[this.activeState as S];
      state.exit();
    } else if (this.type === 'parallel') {
      for (const stateName in this.states) {
        this.states[stateName].exit();
      }
    }

    this.onExit?.();
  }

  transition(stateName: S) {
    if (this.type !== 'sequential') {
      throw new Error('Transitioning is not allowed in non-sequential states');
    }

    // Exit active state
    if (this.activeState) {
      this.states[this.activeState].exit();
    }

    // Update active state before entering new state
    this.activeState = stateName;

    // Enter the new state
    const state = this.states[stateName];
    if (!state) {
      throw new Error(`State ${stateName} not found`);
    }

    state.enter();
    this.machineContext.onTransition?.(this.getState());
  }

  after(ms: number, callback: AfterCallback<S>) {
    const timer = setTimeout(() => {
      const nextState = callback?.();

      if (nextState) {
        this.parentState?.transition(nextState);
      }
    }, ms);

    this.timers.push(timer);

    return this.activeState as S;
  }

  send(event: E): void {
    this.machineContext.eventBus.send(event);
  }

  getState(): MachineState<S> {
    if (this.states) {
      if (this.type === 'sequential') {
        return {
          [this.activeState as S]:
            this.states[this.activeState as S].getState(),
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
