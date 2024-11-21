import { machineFactory } from '..';

// Light switch machine
const machine = machineFactory({
  events: {} as {
    type: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  },
  states: {
    a: {
      states: {
        a1: {
          on: {
            A: () => 'a2',
            B: () => 'b',
          },
        },
        a2: {
          on: {
            B: () => 'b',
          },
        },
      },
    },
    b: {
      type: 'parallel',
      on: {
        B: () => 'c',
      },
      states: {
        b1: {
          states: {
            b11: {
              on: {
                C: () => 'b12',
              },
            },
            b12: {
              on: {
                D: () => 'b11',
              },
            },
          },
        },
        b2: {
          states: {
            b21: {
              on: {
                E: () => 'b22',
              },
            },
            b22: {
              on: {
                F: () => 'b21',
              },
            },
          },
        },
      },
    },
    c: {
      on: {
        G: () => 'a1',
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('State:', state);
});

machine.start();

console.log('\nSending A');
machine.send({ type: 'A' });

console.log('\nSending B');
machine.send({ type: 'B' });

console.log('\nSending C');
machine.send({ type: 'C' });

console.log('\nPress ctrl+c to exit\n');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    machine.stop();
    process.exit(0);
  }
});
