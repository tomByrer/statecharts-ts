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

type StateNodeOptions<E extends MachineEvent, C = unknown> = {
  id: string;
  parallel?: boolean;
  context?: C;
  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
  on?: {
    [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
  };
};

export class MachineNode<E extends MachineEvent, C = unknown> {
  #context?: C;
  #children: MachineNode<E, C>[] = [];
  #parentStateNode?: MachineNode<E, C>;
  #timers: ReturnType<typeof setTimeout>[] = [];
  #handlers: Partial<{
    [K in E['type']]: EventHandler<Extract<E, { type: K }>, C>;
  }> = {};
  #active = false;
  #initialChildId?: string;
  #history?: 'shallow' | 'deep';
  #parallel = false;
  readonly #id: string;

  onEntry?: EntryHandler<C>;
  onExit?: ExitHandler<C>;
  onTransition?: TransitionHandler<C>;

  get id(): string {
    return this.#id;
  }

  get active(): boolean {
    return this.#active;
  }

  get parallel(): boolean {
    return this.#parallel;
  }

  get initialChildId(): string | undefined {
    return this.#initialChildId;
  }

  set initialChildId(value: string | undefined) {
    this.#initialChildId = value;
  }

  constructor(options: StateNodeOptions<E, C>) {
    this.#id = options.id;
    this.#context = options.context;
    this.#parallel = options.parallel ?? false;
    this.onEntry = options.onEntry;
    this.onExit = options.onExit;

    if (options.on) {
      for (const [eventType, handler] of Object.entries(options.on)) {
        this.setTransitionHandler(
          eventType as E['type'],
          handler as EventHandler<Extract<E, { type: E['type'] }>, C>,
        );
      }
    }
  }

  addChildState(child: MachineNode<E, C>, initial?: boolean) {
    if (this.#children.some((c) => c.id === child.id)) {
      throw new StateRegistryError(
        `Child state with ID ${child.id} already exists`,
      );
    }

    child.#parentStateNode = this;
    this.#children.push(child);

    if (initial) {
      this.#initialChildId = child.id;
    }

    return this;
  }

  /**
   * Removes a child state from the current state node.
   *
   * @param child - The child state to remove.
   * @returns The current state node.
   */
  removeChildState(child: MachineNode<E, C>) {
    child.#parentStateNode = undefined;

    this.#children = this.#children.filter((c) => c !== child);

    if (this.#initialChildId === child.id) {
      this.#initialChildId = undefined;
    }

    return this;
  }

  /**
   * Appends a child state to the current state node.
   *
   * @param params - The parameters for the child state.
   * @returns The child state node.
   */
  appendChild(params: {
    id: string;
    onEntry?: EntryHandler<C>;
    onExit?: ExitHandler<C>;
    on?: {
      [K in E['type']]?: EventHandler<Extract<E, { type: K }>, C>;
    };
    initial?: boolean;
  }) {
    const child = new MachineNode<E, C>({
      id: params.id,
      context: this.#context,
      onEntry: params.onEntry,
      onExit: params.onExit,
      on: params.on,
    });

    this.addChildState(child, params.initial);

    return child;
  }

  /**
   * Sets a handler for an event type.
   *
   * @param eventType - The event type to set the handler for.
   * @param handler - The handler to set.
   */
  setTransitionHandler<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, C>,
  ) {
    this.#handlers[eventType] = handler;
  }

  /**
   * Dispatches an event to the current state node.
   *
   * @param event - The event to dispatch.
   */
  dispatch(event: E) {
    // Only dispatch events if the state is active
    if (this.#active) {
      const handler = this.#handlers[event.type as E['type']];

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
          this.transition(targetId);
        }
      }

      // Dispatch the event to all children
      for (const child of this.#children) {
        child.dispatch(event);
      }
    } else {
      console.warn('State is not active, skipping event dispatch', event);
    }
  }

  async transition(targetId: string) {
    // Find target state by searching up through ancestors
    let targetState = this.getStateById(targetId, this);
    let commonAncestor: MachineNode<E, C> | undefined = this.#parentStateNode;

    if (!targetState) {
      while (commonAncestor) {
        targetState = commonAncestor.getStateById(targetId);

        if (targetState) {
          break;
        }

        commonAncestor = commonAncestor.#parentStateNode;
      }
    }

    invariant(targetState, `State with ID ${targetId} not found`);
    invariant(commonAncestor, 'Common ancestor not found');

    // Exit states from current up to common ancestor
    let currentState: MachineNode<E, C> = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const statesToEnter: MachineNode<E, C>[] = [];

    // Find path to common ancestor while exiting states
    while (currentState !== commonAncestor) {
      currentState.exit();
      currentState = currentState.#parentStateNode!;
      statesToEnter.push(currentState);
    }

    // Enter states from common ancestor to target
    statesToEnter.reverse().forEach((state) => state.enter());

    // Finally enter target state
    await targetState.enter();

    for (
      let currentState = targetState.#parentStateNode;
      currentState;
      currentState = currentState.#parentStateNode!
    ) {
      currentState.onTransition?.({
        state: currentState.serialiseState(),
        context: this.getContext(),
      });
    }
  }

  async enter() {
    console.log('Entering state', this.id);
    // Set the state as active
    this.#active = true;

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
        this.transition(targetId);
      }
    });

    // If there are no children, exit the function early
    if (this.#children.length === 0) {
      return;
    }

    const childEnterPromises: Promise<void>[] = [];

    // Check if the state is parallel, meaning it can have multiple active child states
    if (this.parallel) {
      // If parallel, enter all child states
      for (const child of this.#children) {
        childEnterPromises.push(child.enter());
      }
    } else {
      // Select the first initial child state or the first child state if no initial state is found
      const initialChild =
        this.#children.find((child) => child.id === this.initialChildId) ??
        this.#children[0];

      if (!initialChild) {
        throw new Error(`No initial child state found for state ${this.id}`);
      }

      // Enter the selected initial child state
      childEnterPromises.push(initialChild.enter());
    }

    await Promise.all([entryPromise, ...childEnterPromises]);
  }

  async exit(preserveHistory?: 'shallow' | 'deep') {
    console.log('Exiting state', this.id);
    // Perform cleanup unless we're preserving history
    if (!preserveHistory) {
      this.cleanup();
      this.#active = false;
    }

    // Clear all timers regardless of history
    this.#timers.forEach(clearTimeout);
    this.#timers = [];

    const exitPromise = this.onExit?.({
      context: this.getContext(),
    });

    // Exit active children, preserving history if specified
    const historyToPreserve =
      preserveHistory === 'deep' ? 'deep' : this.#history;

    const childExitPromises = this.#children
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
        this.transition(stateId as string);
      }
    }, ms);

    // Store the timer to ensure it can be cleared later if necessary
    this.#timers.push(timer);
  }

  /**
   * Returns all children of the current state node
   *
   * @returns The children of the current state node
   */
  getChildren() {
    return this.#children;
  }

  /**
   * Returns all active children of the current state node
   *
   * @returns The active children of the current state node
   */
  getActiveChildren(): MachineNode<E, C>[] {
    return this.getChildren().filter((child) => child.active);
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
    current: MachineNode<E, C> = this,
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
    const queue: MachineNode<E, C>[] = [...current.#children];

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
      queue.push(...node.#children);
    }
  }

  cleanup() {
    // Clear all timers
    this.#timers.forEach(clearTimeout);
    this.#timers = [];

    // Clear all handlers
    this.#handlers = {};

    // Recursively cleanup children
    this.#children.forEach((child) => child.cleanup());
  }

  setContext(context: C) {
    if (this.#context !== undefined) {
      this.#context = context;
    } else if (this.#parentStateNode) {
      this.#parentStateNode.setContext(context);
    } else {
      throw new Error('Context not found in current or parent state nodes');
    }
  }

  getContext(): C {
    return this.#context ?? (this.#parentStateNode?.getContext() as C);
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
