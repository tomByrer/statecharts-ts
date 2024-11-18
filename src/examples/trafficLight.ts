import { machineFactory } from '../index';

/*
  Traffic light state machine

  This state machine simulates a traffic light system with four states: stop, readyGo, go, and readyStop.
  Each state represents a different phase of the traffic light cycle, controlling both vehicle and pedestrian signals.

  - stop: 
    - Traffic lights are red, and pedestrian lights are green, allowing pedestrians to cross.
    - The system remains in this state for a specified stopPeriod before transitioning to readyGo.

  - beforeReadyGo:
    - Traffic lights are red, and pedestrian lights are red, stopping pedestrians from crossing.
    - The system remains in this state for a specified beforeReadyGoPeriod before transitioning to readyGo.

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

  - afterReadyStop:
    - Traffic lights are red, and pedestrian lights are red, stopping pedestrians from crossing.
    - After a readyStopPeriod, the system transitions back to the stop state.

  The state machine uses context to manage the timing of each state and the current status of traffic and pedestrian lights.
 */
const machine = machineFactory({
  events: {} as { type: 'STOP' },
  context: {
    lights: {
      traffic: {
        red: false,
        amber: false,
        green: false,
      },
      pedestrian: {
        red: false,
        green: false,
      },
      wait: false,
    },
    timeouts: {
      stop: 3_000,
      beforeReadyGo: 2_000,
      readyGo: 3_000,
      readyStop: 3_000,
      afterReadyStop: 2_000,
    },
  },
  states: {
    stop: {
      onEntry: ({ context, updateContext, after }) => {
        const {
          lights: { wait },
          timeouts: { stop },
        } = context;
        updateContext({
          lights: {
            traffic: { red: true, amber: false, green: false },
            pedestrian: { red: false, green: true },
            wait,
          },
        });
        after(stop, () => 'readyGo');
      },
    },
    beforeReadyGo: {
      onEntry: ({ context, updateContext, after }) => {
        const {
          timeouts: { beforeReadyGo },
          lights: { wait },
        } = context;
        updateContext({
          lights: {
            traffic: { red: true, amber: false, green: false },
            pedestrian: { red: false, green: true },
            wait,
          },
        });
        after(beforeReadyGo, () => 'readyGo');
      },
    },
    readyGo: {
      type: 'initial',
      onEntry: ({ context, updateContext, after }) => {
        const {
          timeouts: { readyGo },
          lights: { wait },
        } = context;
        updateContext({
          lights: {
            traffic: { red: true, amber: true, green: false },
            pedestrian: {
              red: true,
              green: false,
            },
            wait,
          },
        });
        after(readyGo, () => 'go');
      },
    },
    go: {
      onEntry: ({ context, updateContext }) => {
        const {
          lights: { wait },
        } = context;
        updateContext({
          lights: {
            traffic: { red: false, amber: false, green: true },
            pedestrian: { red: true, green: false },
            wait,
          },
        });
      },
      on: {
        STOP: () => 'wait',
      },
    },
    wait: {
      onEntry: ({ context, after }) => {
        const {
          timeouts: { readyStop },
        } = context;
        after(readyStop, () => 'stop');
      },
    },
    readyStop: {
      onEntry: ({ context, updateContext, after }) => {
        const {
          timeouts: { readyStop },
          lights: { wait },
        } = context;
        updateContext({
          lights: {
            traffic: { red: false, amber: true, green: false },
            pedestrian: { red: false, green: true },
            wait,
          },
        });
        after(readyStop, () => 'stop');
      },
    },
    afterReadyStop: {
      onEntry: ({ context, updateContext, after }) => {
        const {
          timeouts: { readyStop },
          lights: { wait },
        } = context;
        updateContext({
          lights: {
            traffic: { red: false, amber: true, green: false },
            pedestrian: { red: false, green: true },
            wait,
          },
        });
        after(readyStop, () => 'stop');
      },
    },
  },
  on: {
    STOP: ({ context, updateContext }) => {
      const {
        lights: { wait },
      } = context;

      if (wait) {
        return null;
      }

      updateContext({
        lights: {
          ...context.lights,
          wait,
        },
      });

      return 'wait';
    },
  },
});

machine.subscribe((state, context) => {
  const { pedestrian, traffic, wait } = context.lights;
  const [time] = new Date().toTimeString().split(' ');

  const trafficLights = [
    traffic.red ? '🔴' : '⚫️',
    traffic.amber ? '🟠' : '⚫️',
    traffic.green ? '🟢' : '⚫️',
  ]
    .filter(Boolean)
    .join('');

  const pedestrianLights = [
    pedestrian.red ? '🔴' : '⚫️',
    pedestrian.green ? '🟢' : '⚫️',
  ]
    .filter(Boolean)
    .join('');

  const waitLight = wait ? '🟠' : '⚫️';

  console.log(`[${time}] Transitioned to "${state}"`);
  console.log(`    traffic: ${trafficLights}`);
  console.log(`pedestrians: ${pedestrianLights}`);
  console.log(`       wait: ${waitLight}`);
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
    machine.send({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, CTRL+C to exit');
console.log();

machine.start();
