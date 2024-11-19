import { machineFactory } from '..';

// Light switch machine
const machine = machineFactory({
  events: {} as { type: 'TOGGLE' },
  states: {
    a: {
      onEntry: () => {
        console.log('a');
      },
      on: {
        TOGGLE: () => 'b',
      },
    },
    b: {
      onEntry: () => {
        console.log('b');
      },
      on: {
        TOGGLE: () => 'c',
      },
    },
    c: {
      onEntry: () => {
        console.log('c');
      },
      on: {
        TOGGLE: () => 'c',
      },
    },
  },
});

machine.subscribe((state) => {
  console.log('Current state:', state);
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
