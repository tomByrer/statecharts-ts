import { describe, it, expect } from 'vitest';
import { machineFactory } from './machineFactory';
import type { MachineEvent } from './State';

describe('machineFactory', () => {
  // Define test types
  type TestEvent = MachineEvent & {
    type: 'TOGGLE' | 'RESET';
  };

  type TestContext = {
    count: number;
  };

  type TestStates = 'idle' | 'active';

  it('should create a valid state machine with the provided configuration', () => {
    const machine = machineFactory({
      id: 'test-machine',
      initial: 
      context: {
        count: 0,
      },
      states: {
        initial: 
        idle: {
          on: {
            TOGGLE: 'active',
          },
        },
        active: {
          on: {
            TOGGLE: 'idle',
            RESET: 'idle',
          },
        },
      },
    } as const);

    // Verify the machine was created with correct initial state
    expect(machine).toBeDefined();
    expect(machine.getState()).toBe('idle');
    expect(machine.getContext()).toEqual({ count: 0 });
  });

  it('should handle state transitions correctly', () => {
    const config = {
      id: 'test-machine',
      initial: 'idle' as TestStates,
      context: {
        count: 0,
      },
      states: {
        idle: {
          on: {
            TOGGLE: 'active',
          },
        },
        active: {
          on: {
            TOGGLE: 'idle',
          },
        },
      },
    };

    const machine = machineFactory<TestEvent, TestContext, TestStates>(config);

    // Test state transition
    machine.send({ type: 'TOGGLE' });
    expect(machine.getCurrentState()).toBe('active');

    // Test transition back
    machine.send({ type: 'TOGGLE' });
    expect(machine.getCurrentState()).toBe('idle');
  });
});
