// State.ts

import { invariant } from './lib';

export type SerialisedState<S = string> =
  | S
  | { [K in string]: SerialisedState<S> };

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
export type EntryHandler<C> = (params: {
  after: (ms: number, callback: AfterCallback<C>) => void;
  context: C;
}) => Promise<string | void> | string | void;

/**
 * A handler function that is called when a state is exited.
 *
 * @returns Void.
 */
export type ExitHandler<C> = (params: { context: C }) => Promise<void>;

/**
 * A handler function that is called when a transition is made.
 *
 * @returns Void.
 */
export type TransitionHandler<C> = (params: {
  state: SerialisedState<string>;
  context: C;
}) => Promise<void> | void;

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

type StateNodeOptions<E extends MachineEvent, C> = {
  id: string;
  context?: C;
  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
  };
};

export class StateNode<E extends MachineEvent, C = unknown> {
  private context: C;
  private children: StateNode<E, C>[] = [];
  private parentStateNode: StateNode<E, C> | undefined;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private handlers: Partial<{
    [K in E['type']]: EventHandler<Extract<E, { type: K }>, C>;
  }> = {};

  readonly id: string;

  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;

  initialChildId?: string;
  history?: 'shallow' | 'deep';
  parallel = false;
  active = false;

  constructor(options: StateNodeOptions<E, C>) {
    this.id = options.id;
    this.context = options.context ?? ({} as C);

    this.onEntry = options.onEntry;
    this.onExit = options.onExit;

    if (options.on) {
      for (const [eventType, handler] of Object.entries(options.on)) {
        this.setHandler(
          eventType as E['type'],
          handler as EventHandler<Extract<E, { type: E['type'] }>, C>,
        );
      }
    }
  }

  addChildState(child: StateNode<E, C>, initial?: boolean) {
    child.parentStateNode = this;
    this.children.push(child);

    if (initial) {
      this.initialChildId = child.id;
    }
  }

  removeChildState(child: StateNode<E, C>) {
    child.parentStateNode = undefined;
    this.children = this.children.filter((c) => c !== child);
  }

  appendChild(params: {
    id: string;
    onEntry?: EntryHandler<C>;
    onExit?: ExitHandler<C>;
    on?: {
      [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
    };
  }) {
    const child = new StateNode<E, C>({
      id: params.id,
      context: this.context,
    });

    this.addChildState(child);
  }

  setHandler<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, C>,
  ) {
    this.handlers[eventType] = handler;
  }

  dispatch(event: E) {
    // Only dispatch events if the state is active
    if (this.active) {
      const handler = this.handlers[event.type as E['type']];

      // If the handler exists, dispatch the event
      if (handler) {
        const targetId = handler({
          event: event as Extract<E, { type: E['type'] }>,
          context: this.getContext(),
          setContext: this.setContext.bind(this),
          updateContext: this.updateContext.bind(this),
        });

        // If the handler returns a targetId, transition to that state
        if (targetId) {
          this.transitionTo(targetId);
        }
      }

      // Dispatch the event to all children
      for (const child of this.children) {
        child.dispatch(event);
      }
    }
  }

  transitionTo(targetId: string) {
    invariant(this.parentStateNode, 'Parent state node not found');

    // Find target state by searching up through ancestors
    let targetState = this.getStateById(targetId, this);
    let commonAncestor: StateNode<E, C> | undefined = this.parentStateNode;

    if (!targetState) {
      while (commonAncestor) {
        targetState = commonAncestor.getStateById(targetId);
        if (targetState) break;
        commonAncestor = commonAncestor.parentStateNode;
      }
    }

    invariant(targetState, `State with ID ${targetId} not found`);
    invariant(commonAncestor, 'Common ancestor not found');

    // Exit states from current up to common ancestor
    let currentState: StateNode<E, C> = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const statesToEnter: StateNode<E, C>[] = [];

    // Find path to common ancestor while exiting states
    while (currentState !== commonAncestor) {
      currentState.exit();
      currentState = currentState.parentStateNode!;
      statesToEnter.push(currentState);
    }

    // Enter states from common ancestor to target
    statesToEnter.reverse().forEach((state) => state.enter());

    // Finally enter target state
    targetState.enter();
  }

  getActiveState(currentStateNode: StateNode<E, C>) {
    return currentStateNode.getStateById(this.id);
  }

  async enter() {
    console.log('Entering state', this.id);
    // Set the state as active
    this.active = true;

    // Bind the after function to the current state context
    const context = this.getContext();
    const after = this.after.bind(this);

    const entryPromise = Promise.resolve(
      this.onEntry?.({
        after,
        context,
      }),
    ).then((targetId) => {
      if (targetId) {
        this.transitionTo(targetId);
      }
    });

    // If there are no children, exit the function early
    if (this.children.length === 0) {
      return;
    }

    const childEnterPromises: Promise<void>[] = [];

    // Check if the state is parallel, meaning it can have multiple active child states
    if (this.parallel) {
      // If parallel, enter all child states
      for (const child of this.children) {
        childEnterPromises.push(child.enter());
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
      childEnterPromises.push(initialChild.enter());
    }

    await Promise.all([entryPromise, ...childEnterPromises]);
  }

  async exit(preserveHistory?: 'shallow' | 'deep') {
    // Perform cleanup unless we're preserving history
    if (!preserveHistory) {
      this.cleanup();
      this.active = false;
    }

    // Clear all timers regardless of history
    this.timers.forEach(clearTimeout);
    this.timers = [];

    const exitPromise = this.onExit?.({
      context: this.getContext(),
    });

    // Exit active children, preserving history if specified
    const historyToPreserve =
      preserveHistory === 'deep' ? 'deep' : this.history;

    const childExitPromises = this.children
      .filter((child) => child.active)
      .map((child) => child.exit(historyToPreserve));

    const promises = [exitPromise, ...childExitPromises];

    await Promise.all(promises);
  }

  after(ms: number, callback: AfterCallback<C>) {
    console.log('Scheduling callback', ms, callback);
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
        this.transitionTo(stateId as string);
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

  /**
   * Serialises the state of the state machine into a serialised state object.
   *
   * @param state - The state to serialise.
   * @returns The serialised state.
   */
  serialiseState(state = this): SerialisedState<string> {
    const activeChildren = state.getActiveChildren();

    if (activeChildren.length === 1) {
      return activeChildren[0].id as unknown as string;
    }

    return state.getActiveChildren().reduce(
      (acc, state) => {
        acc[state.id as string] = state.serialiseState();
        return acc;
      },
      {} as Record<string, SerialisedState<string>>,
    );
  }
}
