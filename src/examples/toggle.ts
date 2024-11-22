import { machineFactory } from '..';

// Light switch machine
const machine = machineFactory({
  events: {} as {
    type: 'A' | 'B';
  },
  states: {
    a: {
      states: {
        a1: {
          onEntry: () => {
            console.log('Entering a1');
          },
          onExit: () => {
            console.log('Exiting a1');
          },
          on: {
            A: () => 'a2',
          },
        },
        a2: {
          onEntry: () => {
            console.log('Entering a2');
          },
          onExit: () => {
            console.log('Exiting a2');
          },
          on: {
            A: () => 'b',
          },
        },
      },
    },
    b: {
      parallel: true,
      onEntry: () => {
        console.log('Entering b');
      },
      onExit: () => {
        console.log('Exiting b');
      },
      on: {
        B: () => 'c',
      },
      states: {
        b1: {
          states: {
            b11: {
              onEntry: () => {
                console.log('Entering b11');
              },
              onExit: () => {
                console.log('Exiting b11');
              },
              on: {
                A: () => 'b12',
              },
            },
            b12: {
              on: {
                A: () => 'b11',
              },
            },
          },
        },
        b2: {
          states: {
            b21: {
              onEntry: () => {
                console.log('Entering b21');
              },
              onExit: () => {
                console.log('Exiting b21');
              },
              on: {
                A: () => 'b22',
              },
            },
            b22: {
              onEntry: () => {
                console.log('Entering b22');
              },
              onExit: () => {
                console.log('Exiting b22');
              },
              on: {
                A: () => 'b21',
              },
            },
          },
        },
      },
    },
    c: {
      onEntry: () => {
        console.log('Entering c');
      },
      onExit: () => {
        console.log('Exiting c');
      },
      on: {
        A: () => 'a1',
      },
    },
  },
} as const);

machine.subscribe((state) => {
  console.log('State:', state);
});

machine.start();

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl+c
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }

  // space key
  if (key.toString() === ' ') {
    console.log('Sending A');
    machine.send({ type: 'A' });
  }
});
