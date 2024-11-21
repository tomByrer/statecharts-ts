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

 */

const timeouts = {
  stop: 3_000,
  beforeReadyGo: 2_000,
  readyGo: 3_000,
  readyStop: 3_000,
  afterReadyStop: 2_000,
};

let waiting = false;

const machine = machineFactory({
  events: {} as { type: 'STOP' },
  states: {
    stop: {
      onEntry: ({ after }) => {
        after(timeouts.stop, () => 'readyGo');
      },
    },
    beforeReadyGo: {
      onEntry: ({ after }) => {
        after(timeouts.beforeReadyGo, () => 'readyGo');
      },
    },
    readyGo: {
      type: 'initial',
      onEntry: ({ after }) => {
        after(timeouts.readyGo, () => 'go');
      },
    },
    go: {
      onEntry: () => {},
      on: {
        STOP: () => 'wait',
      },
    },
    wait: {
      onEntry: ({ after }) => {
        after(timeouts.readyStop, () => 'stop');
      },
    },
    readyStop: {
      onEntry: ({ after }) => {
        after(timeouts.readyStop, () => 'stop');
      },
    },
    afterReadyStop: {
      onEntry: ({ after }) => {
        after(timeouts.readyStop, () => 'stop');
      },
    },
  },
  on: {
    STOP: () => {
      if (waiting) {
        return null;
      }

      waiting = true;

      return 'wait';
    },
  },
});

machine.subscribe((state) => {
  const [time] = new Date().toTimeString().split(' ');

  switch (state) {
    case 'stop':
      console.log(time);
      console.log('Pedestrian:', '🟢');
      console.log('Traffic:', '🔴');
      break;

    case 'beforeReadyGo':
      console.log(time);
      console.log('Pedestrian:', '🔴');
      console.log('Traffic:', '🔴');
      break;

    case 'readyGo':
      console.log(time);
      console.log('Pedestrian:', '🔴');
      console.log('Traffic:', '🔴 🟠');
      break;

    case 'go':
      console.log(time);
      console.log('Pedestrian:', '🔴');
      console.log('Traffic:', '🟢');
      break;

    case 'readyStop':
      console.log(time);
      console.log('Pedestrian:', '🔴');
      console.log('Traffic:', '🟠');
      break;

    case 'afterReadyStop':
      console.log(time);
      console.log('Pedestrian:', '🔴');
      console.log('Traffic:', '🔴');
      break;
  }
});

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
    machine.send({ type: 'STOP' });
  }
});

console.clear();
console.log('Press SPACE to trigger stop, ctrl+C to exit\n');

machine.start();

console.log(machine.getState());
