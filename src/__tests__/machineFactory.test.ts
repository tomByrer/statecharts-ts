// src/machineFactory.test.ts
import { describe, it, expect } from 'vitest';
import { MachineEvent } from '../MachineNode';
import { machineFactory } from '../machineFactory';

interface TestEvent extends MachineEvent {
  type: 'START' | 'STOP';
}

describe('machineFactory', () => {
  it('should create a state machine with the given configuration', () => {
    const machine = machineFactory({
      context: { count: 0 },
      events: { type: 'START' } as TestEvent,
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running',
          },
        },
        running: {
          on: {
            STOP: 'idle',
          },
        },
      },
    });

    expect(machine).toBeDefined();
    expect(machine.value).toBe('idle');
  });

  it('should transition states based on events', () => {
    const machine = machineFactory({
      context: { count: 0 },
      events: { type: 'START' } as TestEvent,
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running',
          },
        },
        running: {
          on: {
            STOP: 'idle',
          },
        },
      },
    });

    machine.transition({ type: 'START' });
    expect(machine.value).toBe('running');

    machine.transition({ type: 'STOP' });
    expect(machine.value).toBe('idle');
  });
});
