export type StateType = 'initial' | 'sequential' | 'parallel' | 'leaf';

type AfterHandler<C, S extends string> = (
  stateName: S,
  ms: number,
  callback?: ({ context }: { context?: C }) => void
) => void;

type EntryHandler<C, S extends string> = (params: {
  transitionAfter: AfterHandler<C, S>;
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => void;

type ExitHandler<C> = (params: {
  context?: C;
  updateContext: (context: Partial<C>) => void;
}) => void;

type TransitionHandler<S> = (activeStates: S[]) => S[];

export type MachineEvent = {
  type: string;
  data?: unknown;
};

type EventHandler<E extends MachineEvent, C, S extends string> = (params: {
  event: E;
  context: C;
  updateContext: (context: Partial<C>) => void;
}) => S;

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

export type StateObject = {
  [key: string]: StateObject | string | null;
};

export type MachineState = StateObject | string | null;

export type MachineContext<E extends MachineEvent, C, S extends string> = {
  context: C;
  updateContext: (context: Partial<C>) => void;
  onTransition?: TransitionHandler<S>;
  stateMap: Map<S, StateMachine<E, C, S>>;
};

export class StateMachine<E extends MachineEvent, C, S extends string> {
  private states: Record<S, StateMachine<E, C, S>> = {} as Record<
    S,
    StateMachine<E, C, S>
  >;
  private type: StateType;
  private onEntry?: EntryHandler<C, S>;
  private onExit?: ExitHandler<C>;
  private onTransition?: TransitionHandler<S>;
  private activeStates: S[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  private config: MachineConfig<E, C, S>;
  private machineContext: MachineContext<E, C, S>;

  constructor(
    config: MachineConfig<E, C, S>,
    machineContext: MachineContext<E, C, S>
  ) {
    this.config = config;
    this.type = config.states ? config.type ?? 'sequential' : 'leaf';
    this.onEntry = config.onEntry as EntryHandler<C, S>;
    this.onExit = config.onExit;
    this.machineContext = machineContext;
  }

  public initialise(): void {
    // If there are states, create them
    if (this.config.states) {
      const stateKeys = Object.keys(this.config.states);
      let initialState: S | null = null;

      // Create all states
      for (const stateName of stateKeys) {
        const stateConfig = this.config.states[stateName as S]!;
        // Create the state
        this.states[stateName as S] = new StateMachine<E, C, S>(
          stateConfig,
          this.machineContext
        );

        // If the state is the initial state, set it
        if (stateConfig.type === 'initial') {
          // It is illegal to have more than one initial state
          if (initialState) {
            throw new Error('Multiple initial states found');
          }
          initialState = stateName as S;
        }
      }

      // Transition to the initial state, or the first state if there is no initial state
      if (initialState) {
        this.transition(initialState);
      } else {
        this.transition(stateKeys[0] as S);
      }
    }
  }

  transition(stateName: S) {
    const state = this.states[stateName];

    if (!state) {
      throw new Error(`State ${stateName} not found`);
    }

    if (!this.activeStates.includes(stateName)) {
      this.activeStates.push(stateName);
    }
  }

  transitionAfter(
    stateName: S,
    ms: number,
    callback?: ({ context }: { context?: C }) => void
  ) {}

  send(event: E): void {
    // Handle the event with proper typing
  }

  getState(): MachineState {
    return null;
  }

  dispose(): void {}
}
