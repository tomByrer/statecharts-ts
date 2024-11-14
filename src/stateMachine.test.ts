import { StateMachine } from './StateMachine';

const context = {
  counter: 0,
};

function updateContext(newContext: Partial<typeof context>) {
  Object.assign(context, newContext);
}

type Events =
  | { type: 'E1' }
  | {
      type: 'E2';
      data: {
        something: boolean;
      };
    }
  | { type: 'E3' }
  | { type: 'E4' };

const machine = new StateMachine(
  {
    events: {} as Events,
    states: {
      alpha: {
        type: 'initial',
        on: {
          E1: ({ context, updateContext, event }) => {
            updateContext({
              counter: ++context.counter,
            });
            console.log(event);

            return 'beta';
          },
          E2: ({ event }) => {
            if (event.data.something) {
              return 'alpha';
            } else {
              return 'beta';
            }
          },
        },
      },
      beta: {
        states: {
          beta1: {
            on: {
              E3: () => 'alpha',
            },
            states: {
              beta1a: {
                on: {
                  E4: () => 'beta1',
                },
                onEntry({ transitionAfter, context }) {
                  transitionAfter('beta1b', 1_000);
                },
              },
              beta1b: {
                on: {
                  E4: () => 'alpha',
                },
              },
            },
          },
          beta2: {
            on: {
              E4: () => 'alpha',
            },
          },
        },
      },
      gamma: {
        type: 'parallel',
        on: {
          E2: () => 'alpha',
        },
        states: {
          gamma1: {
            type: 'sequential',
            states: {
              gamma1a: {
                on: {
                  E4: () => 'alpha',
                },
              },
              gamma1b: {
                on: {
                  E4: () => 'alpha',
                },
              },
            },
            on: {
              E2: () => 'alpha',
            },
          },
          gamma2: {
            type: 'sequential',
            states: {
              gamma2a: {
                on: {
                  E4: () => 'alpha',
                },
              },
              gamma2b: {
                on: {
                  E4: () => 'alpha',
                },
              },
            },
            on: {
              E2: () => 'alpha',
            },
          },
        },
      },
    },
  },
  { context, updateContext },
);
