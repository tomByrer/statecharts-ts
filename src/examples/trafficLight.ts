import chalk from 'chalk';
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
      onEntry: ({ context, updateContext }) => {
        updateContext({
          traffic: { red: false, amber: false, green: true },
          pedestrians: { red: false, green: true, wait: false },
        });
      },
      on: {
        stop: ({ transition, updateContext }) => {
          transition('stop');
          updateContext({
            pedestrians: { red: false, green: true, wait: true },
          });
        },
      },
    },
    readyStop: {
      onEntry: ({ context, updateContext, transitionAfter }) => {
        updateContext({
          traffic: { red: false, amber: true, green: false },
          pedestrians: { red: false, green: true, wait: false },
        });
        transitionAfter('stop', context.readyStopPeriod);
      },
    },
  },
  events: {} as { type: 'stop' },
});

machine.subscribe((state, context) => {
  const { pedestrians, traffic } = context;
  console.log(chalk.green('Transitioned to'), state);
  console.table({ pedestrians, traffic });
});

machine.start();
