Certainly! Here's the improved README for your project:

---

![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)

# Statecharts-ts

A lightweight, type-safe statechart (state machine) library for TypeScript. Effortlessly define and manage state transitions while harnessing TypeScript's powerful type system for robust, scalable state management.

## Table of Contents

- [What are Statecharts?](#what-are-statecharts)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Sequential States](#sequential-states)
    - [Initial State](#initial-state)
  - [Parallel States](#parallel-states)
  - [Entry and Exit Actions](#entry-and-exit-actions)
  - [Delayed Transitions](#delayed-transitions)
  - [Events](#events)
  - [Guards](#guards)
- [Examples](#examples)
- [Additional Resources on Statecharts](#additional-resources-on-statecharts)
- [License](#license)

## What are Statecharts?

Statecharts are a powerful extension of finite state machines, introduced by David Harel in the 1980s, that help model the behavior of complex systems in a clear and structured manner. They provide a visual and formal approach to represent states, transitions, and actions, allowing developers to define the possible states of an application and the events that trigger transitions between these states.

Key features of statecharts include:

- **Hierarchical States**: States can contain nested sub-states, enabling better organization and management of complex behaviors.
- **Parallel States**: Support for concurrent states allows different parts of a system to operate independently.
- **Event Handling**: Statecharts can react to events and perform actions, making them suitable for interactive applications.

By using statecharts, developers can create more predictable and maintainable code, facilitating the design of responsive and robust applications.

## Features

- **Lightweight**: Minimal overhead and dependencies for efficient performance.
- **Type-safe**: Leverage TypeScript's type system for compile-time checks and autocompletion.
- **Hierarchical States**: Support for nested states to model complex behaviors.
- **Parallel States**: Handle concurrent states effortlessly.
- **Event-driven**: Define clear transitions and actions based on events.
- **Easy to Use**: Simple API for defining and working with statecharts.

## Installation

Install `statecharts-ts` using npm:

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
    a: { initial: true },
    b: {},
  },
});
```

### Parallel States

Parallel states are states that activate multiple child states simultaneously.

```typescript
const machine = machineFactory({
  parallel: true,
  states: {
    a: {},
    b: {},
  },
});
```

### Entry and Exit Actions

Entry and exit actions are functions that are called when a state is entered or exited.

```typescript
const machine = machineFactory({
  states: {
    a: {},
    b: {
      onEntry: () => {
        console.log('Entering state b');
      },
      onExit: () => {
        console.log('Exiting state b');
      },
    },
  },
});
```

### Delayed Transitions

You can trigger transitions after a delay using the `after` function in `onEntry`.

```typescript
const machine = machineFactory({
  states: {
    a: {
      onEntry: ({ after }) => {
        after(1000, () => 'b');
      },
    },
    b: {},
  },
});
```

### Events

Events can trigger state transitions.

```typescript
type MyEvent = { type: 'EVENT_A' } | { type: 'EVENT_B'; payload: number };

const machine = machineFactory<MyEvent, string>({
  states: {
    a: {
      on: {
        EVENT_A: () => 'b',
      },
    },
    b: {},
  },
});

machine.start();
machine.send({ type: 'EVENT_A' });
```

### Guards

Guards are conditions that determine whether a transition should occur.

```typescript
const context = {
  x: 0,
};

const machine = machineFactory({
  states: {
    a: {
      on: {
        EVENT_A: () => {
          if (context.x % 2 === 0) {
            return 'b';
          } else {
            return 'c';
          }
        },
      },
    },
    b: {},
    c: {},
  },
});
```

## Examples

Please refer to the [examples](./examples) directory for more detailed and complex examples of using `statecharts-ts`.

## Additional Resources on Statecharts

- [Statecharts: A Visual Formalism for Complex Systems](https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf) - The original paper by David Harel.
- [Statecharts by David Harel](https://www.sciencedirect.com/science/article/abs/pii/0167642387900359) - Overview of Harel statecharts.
- [Statechart Diagrams (UML) - Visual Paradigm](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/what-is-state-diagram/) - Introduction to statechart diagrams.
- [Introduction to Hierarchical State Machines](https://statecharts.github.io/) - Interactive guide on hierarchical state machines.
- [State Machines vs. Statecharts - Martin Fowler](https://martinfowler.com/articles/state-machines.html) - Overview by Martin Fowler.
- [Constructing the User Interface with Statecharts](https://archive.org/details/isbn_9780201342789) - Book by Ian Horrocks and Jeff Z. Pan.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

### Improvements Made:

- **Fixed Typos and Syntax Errors**: Corrected typos like `inital` to `initial` and added missing commas in code examples.
- **Updated Code Examples**: Ensured code examples are syntactically correct and accurately demonstrate the features.
- **Clarified Sections**: Renamed and restructured some sections for better clarity, such as combining "Entry" and "Exit" into "Entry and Exit Actions" and renaming "Entry after function" to "Delayed Transitions".
- **Improved Descriptions**: Rephrased sentences to enhance understanding and avoid redundancy.
- **Adjusted Table of Contents**: Removed the "API Reference" section since it was not included in the content and updated the Table of Contents to match the actual sections.
- **Corrected Links**: Fixed formatting of links under "Additional Resources on Statecharts" to remove duplicates and ensure clarity.
- **Consistency**: Ensured consistent formatting and style throughout the document.
- **Expanded Examples**: Provided more complete examples, especially in the "Events" section, to illustrate how to define event types and interact with the state machine.
