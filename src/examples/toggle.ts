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
            A: () => 'a1',
            B: () => 'b',
          },
        },
      },
    },
    b: {
      onEntry: () => {
        console.log('Entering b');
      },
      on: {
        A: () => 'a',
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
  console.log();
  // ctrl+c
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }

  switch (key.toString()) {
    case 'a':
      console.log('Sending A');
      machine.send({ type: 'A' });
      break;
    case 'b':
      console.log('Sending B');
      machine.send({ type: 'B' });
      break;
  }
});
