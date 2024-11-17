import chalk from 'chalk';
import { machineFactory } from '../index';
import cliui from 'cliui';

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
  context: {
    traffic: {
      red: false,
      amber: false,
      green: false,
    },
    pedestrians: {
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
      onEntry: ({ context, updateContext, transitionAfter }) => {
        updateContext({
          traffic: { red: true, amber: false, green: false },
          pedestrians: { red: false, green: true, wait: false },
        });
        transitionAfter('readyGo', context.stopPeriod);
      },
    },
    readyGo: {
      type: 'initial',
      onEntry: ({ context, updateContext, transitionAfter }) => {
        updateContext({
          traffic: { red: true, amber: true, green: false },
          pedestrians: { red: false, green: true, wait: false },
        });
        transitionAfter('go', context.readyGoPeriod);
      },
    },
    go: {
      onEntry: ({ updateContext }) => {
        updateContext({
          traffic: { red: false, amber: false, green: true },
          pedestrians: { red: false, green: true, wait: false },
        });
      },
      on: {
        stop: ({ updateContext }) => {
          updateContext({
            pedestrians: { red: false, green: true, wait: true },
          });
          return 'stop';
        },
      },
    },
    readyStop: {
      onEntry: ({ context, updateContext, transitionAfter }) => {
        updateContext({
          traffic: { red: false, amber: true, green: false },
          pedestrians: { red: false, green: true, wait: false },
        });
        transitionAfter('stop', Number(context.readyStopPeriod));
      },
    },
  },
  events: {} as { type: 'stop' },
});

const ui = cliui({ width: 100 });

machine.subscribe((state, context) => {
  const { pedestrians, traffic } = context;
  console.log(chalk.green('Transitioned to'), state);

  ui.div(
    {
      text: 'Traffic',
      align: 'center',
      width: 15,
      padding: [0, 1, 0, 0],
    },
    {
      text: 'Pedestrians',
      align: 'center',
      width: 15,
      padding: [0, 1, 0, 0],
    },
  );

  ui.div(
    {
      text: [
        traffic.red && 'Red',
        traffic.amber && 'Amber',
        traffic.green && 'Green',
      ]
        .filter(Boolean)
        .join(' + '),
      align: 'center',
      width: 15,
      padding: [0, 1, 0, 0],
    },
    {
      text: [
        pedestrians.red && 'Red',
        pedestrians.green && 'Green',
        pedestrians.wait && 'Wait',
      ]
        .filter(Boolean)
        .join(' + '),
      align: 'center',
      width: 15,
      padding: [0, 1, 0, 0],
    },
  );

  console.log(ui.toString());
});

machine.start();

// Add keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
  // ctrl-c ( end of text )
  if (key.toString() === '\u0003') {
    console.log(chalk.yellow('\nExiting traffic light simulation'));
    process.exit();
  }
  // space key
  if (key.toString() === ' ') {
    console.log(chalk.yellow('Sending stop event'));
    machine.send({ type: 'stop' });
  }
});

console.log(chalk.cyan('Press SPACE to trigger stop, CTRL+C to exit'));
