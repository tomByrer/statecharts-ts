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

### Basic Usage

```typescript
import { machineFactory } from 'statecharts-ts';

const machine = machineFactory({
  // Define your states and events here
});
```

### Sequential States

Sequential states are states that transition to a single child state.

```typescript
const machine = machineFactory({
  states: {
    a: {},
    b: {},
  },
});
```

#### Initial State

The initial state is the state that the machine will start in.

```typescript
const machine = machineFactory({
  states: {
    a: {},
    b: {
      inital: true,
    },
  },
});
```

### Parallel States

Parallel states are states that transition to multiple child states.

```typescript
const machine = machineFactory({
  states: {
    parallel: true
    a: {},
    b: {},
  },
});
```

### Entry

Entry and exit actions are functions that are called when a state is entered or exited.

```typescript
const machine = machineFactory({
  states: {
    a: {},
    b: {
      onEntry: () => {
        console.log('Entering b');
      },
    },
  },
});
```

### Entry after function

Entry after functions are functions that are called after a state is entered, after a delay.

```typescript
const machine = machineFactory({
  states: {
    a: {
      onEntry: ({ after }) => {
        after(1000, () => 'b');
      },
    },
  },
});
```

### Events

Events are functions that are called when an event is received.

```typescript
const machine = machineFactory({
  events: {} as { type: 'EVENT_A' },
  states: {
    a: {
      on: {
        EVENT_A: () => 'b',
      },
    },
    b: {},
  },
});
```

### Exit

Exit actions are functions that are called when a state is exited.

```typescript
const machine = machineFactory({
  states: {
    a: {},
    b: {
      onExit: () => {
        console.log('Exiting b');
      },
    },
  },
});
```

## Examples

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
