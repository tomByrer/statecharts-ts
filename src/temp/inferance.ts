type MachineContext = Record<string, unknown>;

type MachineEvent = {
  type: string;
  data?: unknown;
};

type EventHandler<C, S extends string> = ({
  event,
  context,
  transition,
}: {
  event: MachineEvent;
  context: C;
  transition: (state: S) => void;
}) => void;

type StateDefinition<
  C extends MachineContext,
  E extends MachineEvent,
  S extends string = string
> = {
  states?: Record<S, StateDefinition<C, E>>;
  on?: {
    [K in E['type']]?: EventHandler<C, S>;
  };
};

type RootStateDefinition<
  C extends MachineContext,
  E extends MachineEvent,
  S extends string
> = StateDefinition<C, E, S> & {
  events: E;
  context: C;
  states: Partial<Record<S, StateDefinition<C, E, S>>>;
};

function inferStateMachine<
  C extends MachineContext,
  E extends MachineEvent,
  S extends string
>(stateDefinition: RootStateDefinition<C, E, S>) {
  function subscribe(callback: (state: S, context: C) => () => void) {}
}

inferStateMachine({
  events: {} as { type: 'EVENT_A' } | { type: 'EVENT_B' },
  context: {},
  states: {
    alpha: {
      on: {
        EVENT_A: ({ transition }) => {
          transition('beta22');
        },
      },
    },
    beta: {
      states: {
        beta1: {},
        beta2: {
          states: {
            beta21: {
              on: {
                EVENT_B: ({ transition }) => {
                  transition('epsilon');
                },
              },
            },
            beta22: {},
          },
        },
      },
    },
    gamma: {
      on: {
        EVENT_B: ({ transition }) => {
          transition('delta');
        },
      },
      states: {
        gamma1: {},
        gamma2: {},
      },
    },
    delta: {},
  },
});

const config = {
  states: {
    alpha: {
      states: {
        alpha1: {
          states: {
            alpha1a: {
              states: {
                alpha1a1: {},
                alpha1a2: {},
              },
            },
            alpha1b: {
              states: {
                alpha1b1: {},
                alpha1b2: {},
              },
            },
          },
        },
        alpha2: {
          states: {
            alpha2a: {
              states: {
                alpha2a1: {},
                alpha2a2: {},
              },
            },
            alpha2b: {
              states: {
                alpha2b1: {},
                alpha2b2: {},
              },
            },
          },
        },
      },
      beta: {},
      gamma: {},
    },
  },
};

type States =
  | 'alpha'
  | 'beta'
  | 'gamma'
  | 'alpha1'
  | 'alpha2'
  | 'beta1'
  | 'beta2'
  | 'gamma1'
  | 'gamma2'
  | 'alpha1a'
  | 'alpha1b'
  | 'alpha2a'
  | 'alpha2b'
  | 'alpha1a1'
  | 'alpha1a2'
  | 'alpha1b1'
  | 'alpha1b2'
  | 'alpha2a1'
  | 'alpha2a2'
  | 'alpha2b1'
  | 'alpha2b2';
