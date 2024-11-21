import { machineFactory } from '..';

// Light switch machine
const machine = machineFactory({
  events: {} as { type: 'TOGGLE' },
  states: {
    a: {
      states: {
        a1: {
          on: {
            TOGGLE: () => 'a2',
          },
        },
        a2: {
          on: {
            TOGGLE: () => 'b',
          },
        },
      },
    },
    b: {
      on: {
        TOGGLE: () => 'c',
      },
    },
    c: {
      on: {
        TOGGLE: () => 'a1',
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('State:', state);
});

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    machine.stop();
    process.exit(0);
  }

  machine.send({ type: 'TOGGLE' });
});

console.log('Press any key to toggle the light, ctrl+c to exit\n');

machine.start();
