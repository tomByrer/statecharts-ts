import { EventBus } from './EventBus';

export type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';

type AfterCallback<C, S> = (params: {
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => S;

type EntryHandler<C, S extends string> = (params: {
  after: (ms: number, callback: AfterCallback<C, S>) => S;
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => void;

type ExitHandler<C> = (params: {
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => void;

type TransitionHandler<C> = (machineState: any, context: C) => void;

export type MachineEvent = {
  type: string;
  data?: unknown;
};

type EventHandler<E extends MachineEvent, C, S extends string> = (params: {
  event: E;
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => S | null;

export type MachineConfig<E extends MachineEvent, C, S extends string> = {
  events?: E;
  type?: StateType;
  states?: Partial<{
    [K in S]: MachineConfig<E, C, S>;
  }>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C, S>;
  };
  onEntry?: EntryHandler<C, S>;
  onExit?: ExitHandler<C>;
};

// export type StateObject = {
//   [key: string]: StateObject | string | null;
// };

// export type MachineState = StateObject | string | null;

export type MachineContext<E extends MachineEvent, C, S extends string> = {
  context: C;
  updateContext: (context: Partial<C>) => void;
  eventBus: EventBus<E>;
  onTransition?: TransitionHandler<C>;
};

export class StateMachine<E extends MachineEvent, C, S extends string> {
  private states: Record<S, StateMachine<E, C, S>> = {} as Record<
    S,
    StateMachine<E, C, S>
  >;
  private type: StateType;
  private onEntry?: EntryHandler<C, S>;
  private onExit?: ExitHandler<C>;
  private activeState: S | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private parentState?: StateMachine<E, C, S>;

  private config: MachineConfig<E, C, S>;
  private machineContext: MachineContext<E, C, S>;
  private eventUnsubscribers: (() => void)[] = [];

  constructor(
    config: MachineConfig<E, C, S>,
    machineContext: MachineContext<E, C, S>,
    parentState?: StateMachine<E, C, S>,
  ) {
    this.config = config;
    this.type = config.states ? (config.type ?? 'sequential') : 'leaf';
    this.onEntry = config.onEntry as EntryHandler<C, S>;
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
        this.states[stateName as S] = new StateMachine<E, C, S>(
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

      this.activeState = initialState;
    }
  }

  enter(): void {
    if (this.onEntry) {
      this.onEntry({
        after: this.after.bind(this),
        context: this.machineContext.context,
        updateContext: this.machineContext.updateContext,
      });
    }

    if (this.type === 'sequential') {
      this.transition(this.activeState as S);
    }

    if (this.config.on) {
      for (const eventType in this.config.on) {
        const callback = this.config.on[eventType as E['type']];

        if (callback) {
          const handler = (event: E) => {
            const newState = callback({
              event: event as Extract<E, { type: typeof eventType }>,
              context: this.machineContext.context,
              updateContext: this.machineContext.updateContext,
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
  }

  exit(): void {
    if (this.type === 'sequential') {
      const state = this.states[this.activeState as S];
      state.exit();
    } else if (this.type === 'parallel') {
      for (const stateName in this.states) {
        this.states[stateName].exit();
      }
    }

    for (const unsubscribe of this.eventUnsubscribers) {
      unsubscribe();
    }
    this.eventUnsubscribers = [];

    this.onExit?.({
      context: this.machineContext.context,
      updateContext: this.machineContext.updateContext,
    });
  }

  transition(stateName: S) {
    if (this.type !== 'sequential') {
      throw new Error('Transitioning is not allowed in non-sequential states');
    }

    // Exit active state
    if (this.activeState) {
      this.states[this.activeState].exit();
    }

    // Enter the new state
    const state = this.states[stateName];

    if (!state) {
      throw new Error(`State ${stateName} not found`);
    }

    state.enter();
    this.machineContext.onTransition?.(stateName, this.machineContext.context);
  }

  after(ms: number, callback: AfterCallback<C, S>) {
    const timer = setTimeout(() => {
      const nextState = callback?.({
        context: this.machineContext.context,
        updateContext: this.machineContext.updateContext,
      });

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

  getState() {
    return null;
  }
}
