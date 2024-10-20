import { machineFactory } from '..';

// This example demonstrates a basic state machine using the machineFactory.
// The machine has three states: idle, active, and complete.
// It handles two types of events: NEXT and INCREMENT.

// Create a simple state machine
const machine = machineFactory({
  // Define the events that the state machine can handle.
  // - 'NEXT': Transitions the machine to the next state.
  // - 'INCREMENT': Increases the count in the context.
  events: {} as { type: 'NEXT' } | { type: 'INCREMENT' },

  // Define the initial context of the state machine.
  // The context holds a single property 'count', initialized to 0.
  context: {
    count: 0,
  },

  // Define the type of state machine.
  // 'sequential' indicates that states are processed in a sequence.
  type: 'sequential',

  // Define the states of the state machine.
  // Each state can have entry actions and event handlers.
  states: {
    // The 'idle' state is the initial state of the machine.
    // It handles two events: 'NEXT' and 'INCREMENT'.
    idle: {
      on: {
        // Handles the 'NEXT' event by transitioning to the 'active' state.
        // @param transition - Function to transition to another state.
        NEXT: ({ transition }) => transition('active'),

        // Handles the 'INCREMENT' event by updating the context.
        // Increments the 'count' in the context by 1.
        // @param context - Current context of the machine.
        // @param updateContext - Function to update the context.
        INCREMENT: ({ context, updateContext }) => {
          updateContext({ count: context.count + 1 });
        },
      },
    },

    // The 'active' state is entered after the 'idle' state.
    // It logs the current count when entered and handles the 'NEXT' event.
    active: {
      // Entry action for the 'active' state.
      // Logs the current count to the console.
      // @param context - Current context of the machine.
      onEntry: ({ context }) => {
        console.log(`Entered active state with count: ${context.count}`);
      },
      on: {
        // Handles the 'NEXT' event by transitioning to the 'complete' state.
        // @param transition - Function to transition to another state.
        NEXT: ({ transition }) => transition('complete'),
      },
    },

    // The 'complete' state is the final state of the machine.
    // It logs the final count when entered.
    complete: {
      // Entry action for the 'complete' state.
      // Logs the final count to the console.
      // @param context - Current context of the machine.
      onEntry: ({ context }) => {
        console.log(`Completed with final count: ${context.count}`);
      },
    },
  },
});

// Subscribe to state changes.
// Logs the current state to the console whenever it changes.
// @param state - Current state of the machine.
machine.subscribe((state) => {
  console.log('Current state:', state);
});

// Run the machine
machine.start(); // Start the state machine
machine.send({ type: 'INCREMENT' }); // Send 'INCREMENT' event
machine.send({ type: 'INCREMENT' }); // Send another 'INCREMENT' event
machine.send({ type: 'NEXT' }); // Send 'NEXT' event to transition to 'active'
machine.send({ type: 'NEXT' }); // Send 'NEXT' event to transition to 'complete'
machine.stop(); // Stop the state machine
