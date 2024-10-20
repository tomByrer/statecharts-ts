import { machineFactory } from '..';

const machine = machineFactory({
  events: {} as
    | { type: 'ALPHA_2' }
    | { type: 'BETA_1' }
    | { type: 'BETA_2' }
    | { type: 'GAMMA' },
  context: {},
  states: {
    alpha: {
      states: {
        alpha1: {
          on: {
            ALPHA_2: ({ transition }) => transition('alpha2'),
          },
        },
        alpha2: {
          on: {
            BETA_1: ({ transition }) => transition('beta1'),
          },
        },
      },
    },
    beta: {
      states: {
        beta1: {
          on: {
            BETA_2: ({ transition }) => transition('beta2'),
          },
        },
        beta2: {
          on: {
            GAMMA: ({ transition }) => transition('gamma'),
          },
        },
      },
    },
    gamma: {},
  },
});

machine.subscribe((state) => {
  console.log('Current state:', state);
});

machine.start();

machine.send({ type: 'ALPHA_2' });
machine.send({ type: 'BETA_1' });
// machine.send({ type: 'BETA_2' });
// machine.send({ type: 'GAMMA' });
