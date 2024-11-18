import { machineFactory } from '../index';

/*
  Traffic light state machine

  This state machine simulates a traffic light system with four states: stop, readyGo, go, and readyStop.
  Each state represents a different phase of the traffic light cycle, controlling both vehicle and pedestrian signals.

  - stop: 
    - Traffic lights are red, and pedestrian lights are green, allowing pedestrians to cross.
    - The system remains in this state for a specified stopPeriod before transitioning to readyGo.

  - readyGo:
    - Traffic lights show red and amber, preparing vehicles to move.
    - Pedestrian lights remain green, but pedestrians should not start crossing.
    - After a readyGoPeriod, the system transitions to the go state.

  - go:
    - Traffic lights turn green, allowing vehicles to move.
    - Pedestrian lights are red, stopping pedestrian crossing.
    - The system can transition to the stop state upon receiving a 'stop' event, with pedestrians being warned to wait.

  - readyStop:
    - Traffic lights show amber, preparing vehicles to stop.
    - Pedestrian lights remain red.
    - After a readyStopPeriod, the system transitions back to the stop state.

  The state machine uses context to manage the timing of each state and the current status of traffic and pedestrian lights.
 */
const machine = machineFactory({
  events: {} as { type: 'STOP' },
  context: {
    traffic: {
      red: false,
      amber: false,
      green: false,
    },
    pedestrian: {
      red: false,
      green: false,
      wait: false,
    },
    stopPeriod: 10_000,
    readyGoPeriod: 3_000,
    readyStopPeriod: 3_000,
  },
  states: {
    stop: {
      onEntry: ({ context, updateContext, after }) => {
        updateContext({
          traffic: { red: true, amber: false, green: false },
          pedestrian: { red: false, green: true, wait: false },
        });
        after(context.stopPeriod, () => 'readyGo');
      },
    },
    readyGo: {
      type: 'initial',
      onEntry: ({ context, updateContext, after }) => {
        updateContext({
          traffic: { red: true, amber: true, green: false },
          pedestrian: { red: true, green: false, wait: false },
        });
        after(context.readyGoPeriod, () => 'go');
      },
    },
    go: {
      onEntry: ({ updateContext }) => {
        updateContext({
          traffic: { red: false, amber: false, green: true },
          pedestrian: { red: true, green: false, wait: false },
        });
      },
      on: {
        STOP: ({ updateContext }) => {
          updateContext({
            pedestrian: { red: false, green: true, wait: true },
          });
          return 'stop';
        },
      },
    },
    readyStop: {
      onEntry: ({ context, updateContext, after }) => {
        updateContext({
          traffic: { red: false, amber: true, green: false },
          pedestrian: { red: false, green: true, wait: false },
        });
        after(context.readyStopPeriod, () => 'stop');
      },
    },
    on: {
      STOP: ({ context, updateContext }) => {
        updateContext({ pedestrian: { wait: true } });
        return 'stop';
      },
    },
  },
});

machine.subscribe((state, context) => {
  const { pedestrian: pedestrians, traffic } = context;

  const [time] = new Date().toTimeString().split(' ');
  const trafficLights = [
    traffic.red && 'Red',
    traffic.amber && 'Amber',
    traffic.green && 'Green',
  ]
    .filter(Boolean)
    .join(' + ');

  const pedestriansLights = [
    pedestrians.red && 'Red',
    pedestrians.green && 'Green',
    pedestrians.wait && 'Wait',
  ]
    .filter(Boolean)
    .join(' + ');

  console.log(`[${time}]`);
  console.log(`Transitioned to "${state}"`);
  console.log(`    traffic: ${trafficLights}`);
  console.log(`pedestrians: ${pedestriansLights}`);
  console.log('');
});

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl-c ( end of text )
  if (key.toString() === '\u0003') {
    console.log('\nExiting traffic light simulation');

    process.exit();
  }
  // space key
  if (key.toString() === ' ') {
    console.log('Stop...');

    machine.send({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, CTRL+C to exit');
console.log();

machine.start();
