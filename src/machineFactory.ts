import {
  EntryHandler,
  EventHandler,
  ExitHandler,
  MachineEvent,
  MachineNode,
} from './MachineNode';

/**
 * Configuration for a state in the state machine.
 *
 * @template E - The type of events that the state machine can handle.
 * @template C - The type of context object that is passed to the state machine.
 */
export type NodeConfig<E extends MachineEvent, C = unknown> = {
  /**
   * Events that the state can handle, defined as a union of event types.
   * Example: `{ type: 'EVENT_A' } | { type: 'EVENT_B' }`
   */
  events?: E;

  /**
   * Context object that is passed to the state machine.
   */
  context?: C;

  /**
   * When true, enables concurrent execution of all child states.
   */
  parallel?: boolean;

  /**
   * Designates the initial child state ID.
   * If not specified, defaults to the first child state.
   */
  initial?: string;

  /**
   * Nested state configuration hierarchy.
   */
  states?: Record<string, Partial<NodeConfig<E, C>>>;

  /**
   * Determines state history retention behavior:
   * - shallow: Remembers only immediate child states
   * - deep: Remembers the complete subtree of active states
   */
  history?: 'shallow' | 'deep';

  /**
   * Event handler mappings
   */
  on?: Partial<{
    [K in E['type']]: EventHandler<Extract<E, { type: K }>, C>;
  }>;

  /**
   * Entry handler with optional state transition
   */
  onEntry?: EntryHandler<C>;

  /**
   * Exit handler for cleanup operations
   */
  onExit?: ExitHandler<C>;
};

/**
 * Context or function that returns a context
 */
type ContextOrFn<C> = C | ((context: C) => C);

/**
 * Context object passed to the state machine
 */
export type MachineContext<E extends MachineEvent, C = unknown> = {
  notifyHandlers: (event?: E) => void;
  context: C;
  setContext: (context: ContextOrFn<C>) => C;
};

/**
 * Coerces the node config to the expected type
 */
type CoerceNodeConfig<T extends NodeConfig<MachineEvent, unknown>> = {
  initial: keyof T['states'];
  states: {
    [K in keyof T['states']]: T['states'][K] extends NodeConfig<
      MachineEvent,
      unknown
    >
      ? CoerceNodeConfig<T['states'][K]>
      : T['states'][K];
  };
};

/**
 * Validates the node config
 */
type ValidateNodeConfig<T extends NodeConfig<MachineEvent, unknown> | object> =
  T extends never ? T : CoerceNodeConfig<T>;

/**
 * The configuration object for the state machine
 */
export type MachineFactoryConfig<E extends MachineEvent, C = unknown> = {
  context: C;
  events: E;
} & ValidateNodeConfig<NodeConfig<E, C>>;

/**
 * Factory function for creating type-safe state machines
 * This the expected way to create a state machine, rather than instantiating a StateMachine directly.
 *
 * @param config - The configuration object for the state machine.
 * @returns A new state machine.
 */
export function machineFactory<E extends MachineEvent, C>(
  config: MachineFactoryConfig<E, C>,
) {
  return new MachineNode<E, C>({ id: 'root', ...config });
}
