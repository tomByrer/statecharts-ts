import { machineFactory } from '..';

// Light switch machine
const machine = machineFactory({
  events: {} as { type: 'TOGGLE' },
  context: {
    cycles: 0,
  },
  type: 'sequential',
  states: {
    off: {
      onEntry: ({ context, updateContext }) => {
        updateContext({ cycles: context.cycles + 1 });
      },
      on: {
        TOGGLE: () => 'on',
      },
    },
    on: {
      onEntry: ({ context, updateContext }) => {
        updateContext({ cycles: context.cycles + 1 });
      },
      on: {
        TOGGLE: () => 'off',
      },
    },
  },
});

machine.subscribe((state, context) => {
  console.log('Current state:', state);
  console.log('Context:', context);
});

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // Check for Ctrl+C (hex 03)
  if (key.toString() === '\u0003') {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }

  machine.send({ type: 'TOGGLE' });
});

console.clear();
console.log('Press any key to toggle the light, ctrl+c to exit\n');

machine.start(); // Start the state machine
