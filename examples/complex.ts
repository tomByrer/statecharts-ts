import chalk from 'chalk';
import { machineFactory } from '../machineFactory.js';

const context = {
  x: 0,
  y: 0,
  z: 0,
};

// Create a state machine using the machineFactory function
const machine = machineFactory({
  // Define the events that the state machine can handle
  events: {} as
    | { type: 'EVENT_A' }
    | { type: 'EVENT_B' }
    | { type: 'EVENT_C' }
    | { type: 'EVENT_D' },
  // Define the type of state machine as parallel (states can operate concurrently)
  parallel: true,
  states: {
    // State group 'a' is a sequential state machine (states transition one after another)
    a: {
      states: {
        // Initial state 'aa' of state group 'a'
        aa: {
          on: {
            // Transition from 'aa' to 'ab' on 'EVENT_A' if the condition is met
            EVENT_A: () => {
              // Only transition if the value of context.x is greater than 0
              if (context.x > 0) {
                return 'ab';
              }
              // Log a message if the condition is not met
              console.log(
                chalk.yellow('Condition not met to transition to ab'),
              );
            },
          },
        },
        // State 'ab' of state group 'a'
        ab: {
          // Action to perform when entering state 'ab'
          onEntry: () => {
            console.log(chalk.green(`Entering ab with x: ${context.x}`));
          },
          on: {
            // Transition from 'ab' to 'ac' on 'EVENT_B'
            EVENT_B: () => 'ac',
          },
        },
        // State 'ac' of state group 'a'
        ac: {
          // Action to perform when entering state 'ac'
          onEntry: () => {
            console.log(chalk.blue(`Entering ac, updating y and z`));
            // Update context values y and z when entering state 'ac'
            context.y += 10;
            context.z += 5;
          },
        },
      },
    },
    // State group 'b' is a parallel state machine (multiple states can be active concurrently)
    b: {
      parallel: true,
      states: {
        // State group 'ba' within parallel state 'b'
        ba: {
          states: {
            // Initial state 'baa' of state group 'ba'
            baa: {
              on: {
                // Transition from 'baa' to 'bab' on 'EVENT_C'
                EVENT_C: () => 'bab',
              },
            },
            // State 'bab' of state group 'ba'
            bab: {
              // Action to perform when entering state 'bab'
              onEntry: () => {
                console.log(
                  chalk.red(
                    `Entered bab with updated context: ${JSON.stringify(
                      context,
                    )}`,
                  ),
                );
              },
            },
          },
        },
        // State 'bb' within parallel state 'b'
        bb: {
          on: {
            // Transition from 'bb' to 'bc' on 'EVENT_D'
            EVENT_D: () => 'bc',
          },
        },
        // State 'bc' within parallel state 'b'
        bc: {
          // Action to perform when entering state 'bc'
          onEntry: () => {
            console.log(
              chalk.cyan(
                'Entering bc with current context:',
                JSON.stringify(context),
              ),
            );
          },
        },
      },
    },
    // State group 'c' with multiple sequential states
    c: {
      states: {
        // Initial state 'ca' of state group 'c'
        ca: {
          initial: true,
          // Action to perform when entering the initial state 'ca'
          onEntry: () => {
            console.log(
              chalk.green('Initial state ca of state c, x:', context.x),
            );
          },
          on: {
            // Transition from 'ca' to 'cb' on 'EVENT_B'
            EVENT_B: () => 'cb',
          },
        },
        // State 'cb' of state group 'c'
        cb: {
          // Action to perform when entering state 'cb'
          onEntry: () => {
            console.log(chalk.yellow('Entering cb, modifying context x and y'));
            // Update context values x and y when entering state 'cb'
            context.x += 5;
            context.y -= 3;
          },
          on: {
            // Transition from 'cb' to 'cc' on 'EVENT_C'
            EVENT_C: () => 'cc',
          },
        },
        // Final state 'cc' of state group 'c'
        cc: {
          // Action to perform when entering final state 'cc'
          onEntry: () => {
            console.log(chalk.magenta('Final state cc with context:', context));
          },
        },
      },
    },
  },
});

// Subscribe to state changes and log the current state whenever it changes
machine.subscribe((state) => {
  console.log(chalk.magenta('State'), JSON.stringify(state, null, 2));
});

// Start the state machine
machine.start();

// Send various events to trigger state transitions in the state machine
machine.send({ type: 'EVENT_A' });
machine.send({ type: 'EVENT_B' });
machine.send({ type: 'EVENT_C' });
machine.send({ type: 'EVENT_D' });

// Stop the state machine
machine.stop();
