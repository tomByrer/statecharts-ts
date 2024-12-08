# statecharts-ts

![Version](https://img.shields.io/npm/v/statecharts-ts)
![Downloads](https://img.shields.io/npm/dt/statecharts-ts)
![License](https://img.shields.io/npm/l/statecharts-ts)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

A lightweight, type-safe statechart library for TypeScript with zero dependencies. Build predictable state machines with full type inference and compile-time safety.

## Features

- 🎯 **Fully Type-Safe**: Leverage TypeScript's type system for compile-time checks
- 🪶 **Lightweight**: Zero dependencies, small bundle size
- ⚡ **Fast**: Minimal runtime overhead
- 🔄 **Hierarchical States**: Support for nested state machines
- ⚔️ **Parallel States**: Handle concurrent states effortlessly
- 🕒 **Delayed Transitions**: Schedule state changes with timing controls
- 🛡️ **Guards**: Conditional transitions with full type safety
- 📦 **Context**: Built-in support for state machine context

## Installation

```bash
npm install statecharts-ts
# or
yarn add statecharts-ts
# or
pnpm add statecharts-ts
```

## Quick Start

```typescript
import { machineFactory } from 'statecharts-ts';

// Define your events
type Events = { type: 'TOGGLE' } | { type: 'RESET' };

// Create a machine
const toggleMachine = machineFactory({
  events: {} as Events,
  context: { count: 0 },
  states: {
    off: {
      initial: true,
      on: {
        TOGGLE: () => 'on',
      },
    },
    on: {
      on: {
        TOGGLE: () => 'off',
        RESET: () => 'off',
      },
    },
  },
});

// Start the machine
toggleMachine.start();

// Subscribe to state changes
toggleMachine.subscribe((state) => {
  console.log('Current state:', state);
});

// Send events
toggleMachine.send({ type: 'TOGGLE' });
```

## Core Concepts

### States

States represent the different modes your application can be in. They can be:

```typescript
const machine = machineFactory({
  states: {
    idle: {
      initial: true,
      on: {
        START: () => 'loading',
      },
    },
    loading: {
      onEntry: ({ after }) => {
        after(1000, () => 'complete');
      },
    },
    complete: {},
  },
});
```

### Events

Events trigger transitions between states:

```typescript
type MyEvents = { type: 'START'; data: { id: string } } | { type: 'COMPLETE' };

machine.send({ type: 'START', data: { id: '123' } });
```

### Context

Maintain state data with fully typed context:

```typescript
type Context = {
  user: { id: string } | null;
  attempts: number;
};

const machine = machineFactory<MyEvents, Context>({
  context: { user: null, attempts: 0 },
  states: {
    idle: {
      on: {
        START: ({ context, setContext }) => {
          setContext((ctx) => ({ ...ctx, attempts: ctx.attempts + 1 }));
          return 'loading';
        },
      },
    },
  },
});
```

## Advanced Usage

Check out our [examples](./examples) directory for more complex use cases, including:

- Authentication flows
- Form validation
- API integration
- Concurrent states
- History states

## API Reference

For detailed API documentation, visit our [API docs](./docs/api.md).

## TypeScript Integration

statecharts-ts provides full TypeScript support with strict type checking:

```typescript
// Define your events
type Events = { type: 'SUBMIT'; data: { email: string } } | { type: 'CANCEL' };

// Define your context
interface Context {
  email: string | null;
  error: string | null;
}

// Your machine is now fully typed
const formMachine = machineFactory<Events, Context>({
  context: { email: null, error: null },
  states: {
    idle: {
      initial: true,
      on: {
        // Type-safe event handling
        SUBMIT: ({ event, setContext }) => {
          setContext({ email: event.data.email, error: null });
          return 'submitting';
        },
      },
    },
    submitting: {
      // Type-safe context access
      onEntry: async ({ context }) => {
        try {
          await submitEmail(context.email!);
          return 'success';
        } catch (error) {
          return 'error';
        }
      },
    },
    error: {},
    success: {},
  },
});
```

## Best Practices

### State Organization

- Keep states focused and single-purpose
- Use hierarchical states for complex flows
- Leverage parallel states for independent concerns
- Use meaningful state names that describe the system's behavior

### Event Design

```typescript
// Good: Events are specific and carry relevant data
type Events =
  | { type: 'FORM_SUBMITTED'; data: FormData }
  | { type: 'VALIDATION_FAILED'; data: { errors: string[] } }
  | { type: 'RETRY_REQUESTED' };

// Avoid: Generic events with ambiguous purposes
type BadEvents = { type: 'UPDATE'; data: any } | { type: 'CHANGE' };
```

### Context Management

```typescript
// Good: Structured context with clear types
interface Context {
  user: {
    id: string;
    preferences: UserPreferences;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

// Avoid: Loose context structure
interface BadContext {
  data: any;
  flags: Record<string, boolean>;
}
```

## Performance Considerations

- Use `parallel: true` only when states need to be truly concurrent
- Clean up subscriptions when they're no longer needed
- Avoid deep nesting of states unless necessary
- Use context judiciously for state that truly needs to be shared

## Community and Support

- 📦 [NPM Package](https://www.npmjs.com/package/statecharts-ts)
- 💬 [Discord Community](https://discord.gg/statecharts-ts)
- 📝 [Issue Tracker](https://github.com/yourusername/statecharts-ts/issues)
- 📚 [Documentation](https://statecharts-ts.dev)

## Related Projects

- [XState](https://xstate.js.org/) - A comprehensive, industry-standard state management library for JavaScript/TypeScript
- [Robot](https://github.com/matthewp/robot) - A similar finite state machine library
- [Redux](https://redux.js.org/) - For global state management

## Credits

statecharts-ts is inspired by:

- David Harel's foundational work on statecharts
- David Khourshid's excellent work on [XState](https://github.com/statelyai/xstate)
- The broader state management community

## License

MIT © 2024 Michael Beswick

---
