![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)

# Statecharts-ts

A lightweight, class-less, type-safe statechart (state machine) library for TypeScript. Effortlessly define and manage state transitions while harnessing TypeScript's powerful type system for robust, scalable state management.

## Table of Contents

- [What are Statecharts?](#what-are-statecharts)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Additional Resources on Statecharts](#additional-resources-on-statecharts)
- [License](#license)

## What are Statecharts?

Statecharts are a powerful extension of finite state machines, introduced by David Harel in the 1980s, that help model the behavior of complex systems in a clear and structured manner. They provide a visual and formal approach to represent states, transitions, and actions, allowing developers to define the possible states of an application and the events that trigger transitions between these states.

Key features of statecharts include:

- Hierarchical States: States can contain nested sub-states, enabling better organization and management of complex behaviors.
- Parallel States: Support for concurrent states allows different parts of a system to operate independently.
- Event Handling: Statecharts can react to events and perform actions, making them suitable for interactive applications.

By using statecharts, developers can create more predictable and maintainable code, facilitating the design of responsive and robust applications.

## Features

- **Lightweight**: Minimal overhead and dependencies for efficient performance.
- **Class-less**: Functional approach for easy integration and testing.
- **Type-safe**: Leverage TypeScript's type system for compile-time checks and autocompletion.
- **Hierarchical States**: Support for nested states to model complex behaviors.
- **Parallel States**: Handle concurrent states effortlessly.
- **Event-driven**: Define clear transitions and actions based on events.
- **Easy to use**: Simple API for defining and working with statecharts.

## Installation

Install statecharts-ts using npm:

```bash
npm install statecharts-ts
```

Or using yarn:

```bash
yarn add statecharts-ts
```

## Usage

Here's a basic example of how to use `statecharts-ts`:

```typescript
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
```

## API Reference

### State Machine

#### `createStateMachine(config)`

Creates a state machine with the given configuration.

```typescript
function createStateMachine<C>(config: RootStateDefinition<C>): Machine<C>;
```

- **Type Parameters:**
  - `C`: The type of the context object.
- **Parameters:**
  - `config`: The configuration object for the state machine.
    - `type`: The type of the root state, either 'sequential' or 'parallel'.
    - `states`: A record of state definitions.
    - `events`: An array of events that the state machine can handle.
    - `context`: The initial context object for the state machine.
- **Returns:** An instance of `Machine<C>` with the following methods:
  - `start()`: Initializes the state machine and enters the initial state(s).
  - `stop()`: Stops the state machine and cleans up resources.
  - `getState()`: Returns the current state of the machine.
  - `getContext()`: Returns the current context of the machine.
  - `send(event)`: Sends an event to the state machine, potentially triggering a state transition.
  - `subscribe(callback)`: Subscribes a callback function to be notified of state changes.
  - `unsubscribe(callback)`: Unsubscribes a previously registered callback.

### Types

#### `StateDefinition<C>`

Defines the structure of a state in the state machine.

```typescript
type StateDefinition<C> = {
  type?: StateType;
  states?: Record<string, StateDefinition<C>>;
  on?: Record<string, EventHandler<C>>;
  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
};
```

- **Type Parameters:**
  - `C`: The type of the context object.

#### `RootStateDefinition<C>`

Defines the root state configuration for a state machine.

```typescript
type RootStateDefinition<C> = {
  type?: Exclude<StateType, 'leaf' | 'initial'>;
  states: Record<string, StateDefinition<C>>;
  events: MachineEvent;
  context: C;
};
```

- **Type Parameters:**
  - `C`: The type of the context object.

### Helper Functions

#### `transitionAfter(stateName, ms, callback)`

Schedules a transition to a new state after a delay.

- **Parameters:**
  - `stateName`: The name of the state to transition to.
  - `ms`: The delay in milliseconds.
  - `callback`: Optional callback to execute after the delay.

### Parallel and Nested States

The state machine supports both parallel and nested states, allowing for complex state hierarchies. Parallel states can have multiple active sub-states simultaneously, while nested states allow for hierarchical state representation.

- **Handling Parallel States**: Events are processed independently for each active sub-state.
- **Handling Nested States**: The state machine traverses the hierarchy to execute transitions.

## Examples

### Complex State Machine Example

Here's a simple example of using the `machineFactory` to create a state machine with parallel and sequential states:

```typescript
import chalk from 'chalk';
import { machineFactory } from '..';

// Create a state machine using the machineFactory function
const machine = machineFactory({
  // Define the events that the state machine can handle
  events: {} as
    | { type: 'EVENT_A' }
    | { type: 'EVENT_B' }
    | { type: 'EVENT_C' }
    | { type: 'EVENT_D' },
  // Define the initial context of the state machine
  context: {
    x: 0, // Initial value for context variable 'x'
    y: 0, // Initial value for context variable 'y'
    z: 0, // Initial value for context variable 'z'
  },
  // Define the type of state machine as parallel (states can operate concurrently)
  type: 'parallel',
  states: {
    // State group 'a' is a sequential state machine (states transition one after another)
    a: {
      type: 'sequential',
      states: {
        // Initial state 'aa' of state group 'a'
        aa: {
          on: {
            // Transition from 'aa' to 'ab' on 'EVENT_A' if the condition is met
            EVENT_A: ({ transition, context }) => {
              // Only transition if the value of context.x is greater than 0
              if (context.x > 0) {
                return transition('ab');
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
          onEntry: ({ context }) => {
            console.log(chalk.green(`Entering ab with x: ${context.x}`));
          },
          on: {
            // Transition from 'ab' to 'ac' on 'EVENT_B'
            EVENT_B: ({ transition }) => transition('ac'),
          },
        },
        // State 'ac' of state group 'a'
        ac: {
          // Action to perform when entering state 'ac'
          onEntry: ({ context, updateContext }) => {
            console.log(chalk.blue(`Entering ac, updating y and z`));
            // Update context values y and z when entering state 'ac'
            updateContext({ y: context.y + 10, z: context.z + 5 });
          },
        },
      },
    },
    // State group 'b' is a parallel state machine (multiple states can be active concurrently)
    b: {
      type: 'parallel',
      states: {
        // State group 'ba' within parallel state 'b'
        ba: {
          states: {
            // Initial state 'baa' of state group 'ba'
            baa: {
              on: {
                // Transition from 'baa' to 'bab' on 'EVENT_C'
                EVENT_C: ({ transition }) => transition('bab'),
              },
            },
            // State 'bab' of state group 'ba'
            bab: {
              // Action to perform when entering state 'bab'
              onEntry: ({ context }) => {
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
            EVENT_D: ({ transition }) => transition('bc'),
          },
        },
        // State 'bc' within parallel state 'b'
        bc: {
          // Action to perform when entering state 'bc'
          onEntry: ({ context }) => {
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
          type: 'initial',
          // Action to perform when entering the initial state 'ca'
          onEntry: ({ context }) => {
            console.log(
              chalk.green('Initial state ca of state c, x:', context.x),
            );
          },
          on: {
            // Transition from 'ca' to 'cb' on 'EVENT_B'
            EVENT_B: ({ transition }) => transition('cb'),
          },
        },
        // State 'cb' of state group 'c'
        cb: {
          // Action to perform when entering state 'cb'
          onEntry: ({ context, updateContext }) => {
            console.log(chalk.yellow('Entering cb, modifying context x and y'));
            // Update context values x and y when entering state 'cb'
            updateContext({ x: context.x + 5, y: context.y - 3 });
          },
          on: {
            // Transition from 'cb' to 'cc' on 'EVENT_C'
            EVENT_C: ({ transition }) => transition('cc'),
          },
        },
        // Final state 'cc' of state group 'c'
        cc: {
          // Action to perform when entering final state 'cc'
          onEntry: ({ context }) => {
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
```

This example demonstrates how to define a state machine with both parallel and sequential states, handle events, and update context values. The `machineFactory` function is used to create the state machine, and `chalk` is used for colored console output.

## Complex Example

Please refer to the [examples](src/examples) directory for more detailed and complex examples of using statecharts-ts.

## Additional Resources on Statecharts

- [Statecharts: A Visual Formalism for Complex Systems](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf)[ (PDF)](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf) - The original paper by David Harel.
- [Statecharts by David Harel](https://www.sciencedirect.com/science/article/abs/pii/0167642387900359) - Overview of Harel statecharts.
- [Statechart Diagrams (UML)](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/)[ - Visual Paradigm](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/) - Introduction to statechart diagrams.
- [Introduction to Hierarchical State Machines](https://statecharts.github.io/) - Interactive guide on hierarchical state machines.
- [State Machines vs. Statecharts](https://martinfowler.com/articles/state-machines.html)[ - Martin Fowler](https://martinfowler.com/articles/state-machines.html) - Overview by Martin Fowler.
- [Constructing the User Interface with Statecharts](https://archive.org/details/isbn_9780201342789) - Book by Ian Horrocks and Jeff Z. Pan.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
