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

machine.subscribe((state) => {
  console.log('Current state:', state);
});

console.log('Press any key to toggle the light, ctrl+c to exit\n');

process.stdin.setRawMode(true); // Enable raw mode to capture any key press
process.stdin.resume(); // Ensure the stdin stream is resumed

process.stdin.on('data', (key) => {
  // Check for Ctrl+C (hex 03)
  if (key[0] === 0x03) {
    console.log('Exiting...');
    machine.stop();
    process.exit(0);
  }
  machine.send({ type: 'TOGGLE' });
});

// Run the machine
machine.start(); // Start the state machine
