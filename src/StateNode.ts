// State.ts

import { invariant } from './lib';

/**
 * Represents an event that can be handled by the state machine.
 *
 * @template T - The type of data that can be carried by the event.
 */
export type MachineEvent<D = unknown> = {
  type: 'START' | 'STOP' | 'AFTER_DELAY' | string;
  data?: D;
};

/**
 * A callback function that can be scheduled to run after a delay.
 *
 * @template S - The type of state identifier.
 * @returns The state identifier.
 */
type AfterCallback<C> = ({
  context,
  setContext,
  updateContext,
}: {
  context: C;
  setContext: (context: C) => void;
  updateContext: (callback: (context: C) => C) => void;
}) => Promise<string | void> | string | void;

/**
 * A handler function that is called when a state is entered.
 *
 * @template S - The type of state identifier.
 * @param params - Parameters for the entry handler.
 * @param params.after - A function to schedule a callback to run after a delay.
 * @returns The state identifier or void.
 */
export type EntryHandler<C, E> = (params: {
  after: (ms: number, callback: AfterCallback<C>) => void;
  context: C;
  event: E;
}) => Promise<string | void> | string | void;

/**
 * A handler function that is called when a state is exited.
 *
 * @returns Void.
 */
export type ExitHandler<C, E> = (params: {
  context: C;
  event: E;
}) => Promise<void>;

/**
 * A handler function that is called when an event is handled.
 *
 * @template E - The type of event.
 * @template S - The type of state identifier.
 * @param event - The event being handled.
 * @returns The state identifier or void.
 */
export type EventHandler<E, C> = (params: {
  event: E;
  context: C;
  setContext: (context: C) => void;
  updateContext: (callback: (context: C) => C) => void;
}) => string | void;

export class StateRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateRegistryError';
  }
}

export class StateNode<E extends MachineEvent, C = unknown> {
  private context: C;
  private children: StateNode<E, C>[] = [];
  private parentStateNode: StateNode<E, C> | undefined;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private handlers: Partial<{
    [K in E['type']]: EventHandler<Extract<E, { type: K }>, C>;
  }> = {};

  readonly id: string;

  onEntry?: EntryHandler<C, E>;
  onExit?: ExitHandler<C, E>;

  initialChildId?: string;
  history?: 'shallow' | 'deep';
  parallel = false;
  active = false;

  constructor(params: { events?: E; id: string; context?: C }) {
    this.id = params.id;
    this.context = params.context ?? ({} as C);
  }

  addChild(child: StateNode<E, C>, initial?: boolean) {
    child.parentStateNode = this;
    this.children.push(child);

    if (initial) {
      this.initialChildId = child.id;
    }
  }

  removeChild(child: StateNode<E, C>) {
    child.parentStateNode = null;
    this.children = this.children.filter((c) => c !== child);
  }

  createChild(
    id: string,
    options?: {
      initial?: boolean;
      onEntry?: EntryHandler<C, E>;
      onExit?: ExitHandler<C, E>;
    },
  ) {
    const child = new StateNode<E, C>({
      id,
      context: this.context,
    });

    child.onEntry = options?.onEntry;
    child.onExit = options?.onExit;

    this.addChild(child);

    return child;
  }

  setHandler<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, C>,
  ) {
    this.handlers[eventType] = handler;
  }

  dispatchEvent(event: E) {
    if (this.active) {
      const handler = this.handlers[event.type as E['type']];

      if (handler) {
        const targetId = handler({
          event: event as Extract<E, { type: E['type'] }>,
          context: this.getContext(),
          setContext: this.setContext.bind(this),
          updateContext: this.updateContext.bind(this),
        });

        if (targetId) {
          this.transitionTo(targetId, event);
        }
      }

      for (const child of this.children) {
        child.dispatchEvent(event);
      }
    }
  }

  transitionTo(targetId: string, event: E) {
    invariant(this.parentStateNode, 'Parent state node not found');

    // Start search from parent state node
    let targetState = this.getStateById(targetId, this);
    let searchState: StateNode<E, C> | undefined = this.parentStateNode;

    if (!targetState) {
      while (searchState) {
        const found = searchState.getStateById(targetId);

        if (found) {
          targetState = found;

          break;
        }

        searchState = searchState.parentStateNode;
      }
    }

    invariant(targetState, `State with ID ${targetId} not found`);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentState: StateNode<E, C> = this;

    while (currentState !== searchState) {
      currentState = currentState.parentStateNode!;
      currentState.exit(event);
    }

    const nodes: StateNode<E, C>[] = [];

    while (currentState !== searchState) {
      nodes.push(currentState);
      currentState = currentState.parentStateNode!;
    }

    nodes.reverse().forEach((node) => {
      node.enter(event);
    });

    // Exit the current state
    this.exit(event);
    // Enter the target state
    targetState.enter(event);
  }

  getActiveState(currentStateNode: StateNode<E, C>) {
    return currentStateNode.getStateById(this.id);
  }

  async enter(event: E) {
    // Set the state as active
    this.active = true;

    // Bind the after function to the current state context
    const context = this.getContext();
    const after = this.after.bind(this);

    // Check if there's an onEntry handler and execute it if present
    if (this.onEntry) {
      // Execute the onEntry handler, passing the bound after function
      const targetId = await this.onEntry({
        after,
        context,
        event,
      });

      // If the onEntry handler returns a targetId, transition to that state
      if (targetId) {
        this.transitionTo(targetId, event);
      }
    }

    // If there are no children, exit the function early
    if (this.children.length === 0) {
      return;
    }

    // Check if the state is parallel, meaning it can have multiple active child states
    if (this.parallel) {
      // If parallel, enter all child states
      for (const child of this.children) {
        child.enter(event);
      }
    } else {
      // Select the first initial child state or the first child state if no initial state is found
      const initialChild =
        this.children.find((child) => child.id === this.initialChildId) ??
        this.children[0];

      if (!initialChild) {
        throw new Error(`No initial child state found for state ${this.id}`);
      }

      // Enter the selected initial child state
      initialChild.enter(event);
    }
  }

  async exit(event: E, preserveHistory?: 'shallow' | 'deep') {
    // Perform cleanup unless we're preserving history
    if (!preserveHistory) {
      this.cleanup();
      this.active = false;
    }

    // Clear all timers regardless of history
    this.timers.forEach(clearTimeout);
    this.timers = [];

    await this.onExit?.({
      context: this.getContext(),
      event,
    });

    // Exit active children, preserving history if specified
    const historyToPreserve =
      preserveHistory === 'deep' ? 'deep' : this.history;
    this.children.forEach((child) => {
      if (child.active) {
        child.exit(event, historyToPreserve);
      }
    });
  }

  after(ms: number, callback: AfterCallback<C>) {
    // Create a timer that will execute the callback function after the specified delay
    const timer = setTimeout(async () => {
      // Execute the callback function to get the ID of the state to transition to
      const stateId = await callback({
        context: this.getContext(),
        setContext: this.setContext.bind(this),
        updateContext: this.updateContext.bind(this),
      });

      if (stateId) {
        // Transition to the new state
        this.transitionTo(stateId as string, { type: 'AFTER_DELAY' } as E);
      }
    }, ms);

    // Store the timer to ensure it can be cleared later if necessary
    this.timers.push(timer);
  }

  getActiveChildren(): StateNode<E, C>[] {
    return this.children.filter((child) => child.active);
  }

  /*
   * Searches for and returns a StateNode with the given ID in the state tree
   * Performs a breadth-first search starting from the current node
   * Can exclude a specific node ID from the search
   * Returns undefined if no matching node is found
   *
   * @param id - The ID of the state to search for
   * @param current - The current state node to start the search from
   * @param excludeId - The ID of the state to exclude from the search
   * @returns The state node with the given ID, or undefined if not found
   */
  getStateById(
    id: string,
    current: StateNode<E, C> = this,
    excludeId?: string,
  ) {
    // Return early if we've found the excluded ID
    if (current.id === excludeId) {
      return undefined;
    }

    // Check if current node matches target ID
    if (current.id === id) {
      return current;
    }

    // Initialize queue with current node's children
    const queue: StateNode<E, C>[] = [...current.children];

    // Perform breadth-first search
    while (queue.length > 0) {
      const node = queue.shift()!;

      // Skip excluded nodes
      if (node.id === excludeId) {
        continue;
      }

      // Return if we found the target ID
      if (node.id === id) {
        return node;
      }

      // Add children to queue to continue search
      queue.push(...node.children);
    }

    return undefined;
  }

  cleanup() {
    // Clear all timers
    this.timers.forEach(clearTimeout);
    this.timers = [];

    // Clear all handlers
    this.handlers = {};

    // Recursively cleanup children
    this.children.forEach((child) => child.cleanup());
  }

  setContext(context: C) {
    if (this.context !== undefined) {
      this.context = context;
    } else if (this.parentStateNode) {
      this.parentStateNode.setContext(context);
    } else {
      throw new Error('Context not found in current or parent state nodes');
    }
  }

  getContext(): C {
    const context = this.context ?? this.parentStateNode?.getContext();

    invariant(context, 'Context not found in current or parent state nodes');

    return context;
  }

  updateContext(callback: (context: C) => C) {
    this.setContext(callback(this.getContext()));
  }
}
