// src/State.ts
var StateRegistryError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "StateRegistryError";
  }
};
var State = class {
  /**
   * Collection of child states.
   */
  children = [];
  parentState;
  /**
   * Active timers managed by this state.
   */
  timers = [];
  handlers = {};
  machineContext;
  id;
  onEntry;
  onExit;
  parallel = false;
  initial = false;
  active = false;
  history;
  constructor(parentState, id, machineContext) {
    this.id = id;
    this.parentState = parentState;
    this.machineContext = machineContext;
  }
  /**
   * Adds a child state to the current state.
   *
   * @param child - The child state to add.
   * @throws {StateRegistryError} When attempting to register a duplicate state ID
   */
  addChild(child) {
    this.children.push(child);
    if (this.machineContext.stateRegistry.has(child.id)) {
      this.children.pop();
      throw new StateRegistryError(
        `Cannot register state: ID "${child.id}" is already registered in the state machine.`
      );
    }
    this.machineContext.stateRegistry.set(child.id, child);
  }
  /**
   * Registers an event handler for a specific event type.
   *
   * @param eventType - The type of event to listen for.
   * @param handler - The function to call when the specified event is received.
   */
  setHandler(eventType, handler) {
    this.handlers[eventType] = handler;
  }
  /**
   * Notifies listeners of an event and propagates it to child states if specified.
   *
   * @param event - The event to notify listeners of.
   * @param trickleDown - Whether to trickle down the event to child states.
   */
  notifyHandlers(params) {
    const { event, trickleDown = true } = params;
    if (this.active) {
      const handler = this.handlers[event.type];
      if (handler) {
        const targetId = handler({
          event,
          context: this.machineContext.context,
          setContext: this.machineContext.setContext
        });
        if (targetId) {
          this.transitionTo({ targetId, event });
        }
      }
    }
    if (trickleDown) {
      this.notifyChildren(event);
    }
  }
  /**
   * Transitions the state machine to a new state.
   *
   * @param targetId - The identifier of the target state to transition to.
   * @param event - The event to transition to the target state with.
   */
  transitionTo(params) {
    const { targetId, event } = params;
    const targetState = this.getStateById(targetId);
    this.exit({ event });
    targetState.enter({ event });
    this.machineContext.notifyHandlers(event);
  }
  /**
   * Notifies all active child states of an event.
   *
   * @param event - The event to notify the child states of.
   */
  notifyChildren(event) {
    for (const child of this.getActiveChildren()) {
      child.notifyHandlers({ event });
    }
  }
  /**
   * Registers a listener for a specific event type.
   *
   * @template T - The type of the event to listen for.
   * @param eventType - The type of the event to listen for.
   * @param handler - The function to call when the event is received.
   */
  on(eventType, handler) {
    this.setHandler(eventType, handler);
  }
  /**
   * Enters the state, making it active and handling any necessary transitions or child state entries.
   */
  async enter(params) {
    const { serialisedState, event } = params;
    this.active = true;
    const { context, setContext } = this.machineContext;
    const after = this.after.bind(this);
    if (this.onEntry) {
      const targetId = await this.onEntry({
        after,
        context,
        setContext,
        event
      });
      if (targetId) {
        this.transitionTo({ targetId, event });
      }
    }
    if (serialisedState) {
      if (typeof serialisedState === "string") {
        this.transitionTo({ targetId: serialisedState, event });
      } else if (!this.parallel && this.children.length > 0) {
        this.children.forEach((child) => {
          child.enter({ serialisedState: serialisedState[child.id], event });
        });
      }
      return;
    }
    if (this.children.length === 0) {
      return;
    }
    if (this.parallel) {
      for (const child of this.children) {
        child.enter({ event });
      }
    } else {
      const initialChildren = this.children.filter((child) => child.initial);
      if (initialChildren.length > 1) {
        console.warn(
          `Multiple initial states found for state ${this.id}. Using first match.`
        );
      }
      const initialChild = initialChildren[0] ?? this.children[0];
      initialChild.enter({ event });
    }
  }
  /**
   * Exits the state, deactivating it and clearing all timers.
   * If preserveHistory is not specified or false, the state is deactivated.
   * If preserveHistory is 'shallow' or 'deep', the state's history is preserved.
   * If the onExit handler is defined, it is executed.
   * If the state has active children, they are exited, preserving history if specified.
   *
   * @param preserveHistory - If 'shallow' or 'deep', the state's history is preserved.
   */
  async exit(params) {
    const { preserveHistory, event } = params;
    if (!preserveHistory) {
      this.cleanup();
      this.active = false;
    }
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const { context, setContext: originalSetContext } = this.machineContext;
    const wrappedSetContext = (contextOrFn) => {
      const newContext = typeof contextOrFn === "function" ? contextOrFn(context) : contextOrFn;
      return originalSetContext(newContext);
    };
    await this.onExit?.({
      context,
      setContext: wrappedSetContext,
      event
    });
    const historyToPreserve = preserveHistory === "deep" ? "deep" : this.history;
    this.children.forEach((child) => {
      if (child.active) {
        child.exit({ preserveHistory: historyToPreserve, event });
      }
    });
  }
  /**
   * Schedules a transition to a new state after a specified delay.
   *
   * @param ms - The delay in milliseconds before transitioning to the new state.
   * @param callback - A function that returns the ID of the state to transition to.
   */
  after(ms, callback) {
    const { context, setContext } = this.machineContext;
    const timer = setTimeout(async () => {
      const stateId = await callback({ context, setContext });
      this.transitionTo({
        targetId: stateId,
        event: { type: "AFTER_DELAY" }
      });
    }, ms);
    this.timers.push(timer);
  }
  /**
   * Returns an array of active children of the state.
   * Active children are those that have their active property set to true.
   *
   * @returns {State<E, S>[]} - An array of active children of the state.
   */
  getActiveChildren() {
    return this.children.filter((child) => child.active);
  }
  /**
   * Finds and returns a child state by its ID.
   *
   * @param id - The ID of the child state to find.
   * @returns {State<E, S>} - The child state with the specified ID, or undefined if not found.
   */
  getChildById(id) {
    return this.children.find((child) => child.id === id);
  }
  /**
   * Finds and returns a sibling state by its ID.
   *
   * @param id - The ID of the sibling state to find.
   * @returns {State<E, S>} - The sibling state with the specified ID, or undefined if not found.
   */
  getSiblingById(id) {
    return this.parentState?.getChildById(id);
  }
  /**
   * Finds and returns a state by its ID, searching through children, siblings, and the state registry.
   *
   * @param id - The ID of the state to find.
   * @returns {State<E, S>} - The state with the specified ID, or throws an error if not found.
   * @throws {Error} When the state is not found
   */
  getStateById(id) {
    const state = this.getChildById(id) ?? this.getSiblingById(id) ?? this.machineContext.stateRegistry.get(id);
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    return state;
  }
  /**
   * Cleans up all resources associated with this state and its children.
   * This includes timers and any registered handlers.
   */
  cleanup() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.handlers = {};
    this.children.forEach((child) => child.cleanup());
  }
};

// src/StateMachine.ts
var StateMachineError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "StateMachineError";
  }
};
var StateMachine = class {
  handlers = [];
  stateRegistry = /* @__PURE__ */ new Map();
  context;
  rootState;
  /**
   * Returns true if the state machine is running.
   *
   * @returns True if the state machine is running.
   */
  get isRunning() {
    return this.rootState.active;
  }
  /**
   * Constructs a new state machine.
   */
  constructor(rootConfig) {
    const { context, ...config } = rootConfig;
    this.handlers = [];
    this.context = context ?? {};
    this.rootState = this.buildState(config, null, "root");
  }
  setContext(context) {
    this.context = typeof context === "function" ? context(this.context) : context;
    return this.context;
  }
  /**
   * Builds a state from a configuration object.
   *
   * @param config - The configuration object for the state.
   * @param parent - The parent state of the new state.
   * @param id - The id of the new state.
   * @returns The new state.
   */
  buildState(config, parent, id) {
    const machineContext = {
      stateRegistry: this.stateRegistry,
      notifyHandlers: () => this.notifyHandlers(this.rootState),
      context: this.context,
      setContext: this.setContext.bind(this)
    };
    const state = new State(parent, id, machineContext);
    state.parallel = config.parallel ?? false;
    state.onEntry = config.onEntry;
    state.onExit = config.onExit;
    state.initial = config.initial ?? false;
    for (const event in config.on) {
      const handler = config.on[event];
      state.setHandler(event, handler);
    }
    if (config.states) {
      const stateEntries = Object.entries(config.states);
      for (const [childId, childConfig] of stateEntries) {
        const childState = this.buildState(childConfig, state, childId);
        state.addChild(childState);
      }
    }
    return state;
  }
  /**
   * Returns the state with the given id.
   *
   * @param id - The id of the state to return.
   * @returns The state with the given id.
   */
  getStateById(id) {
    return this.stateRegistry.get(id);
  }
  /**
   * Subscribes a handler to the state machine.
   *
   * @param handler - The handler to subscribe.
   * @returns A function to unsubscribe the handler.
   */
  subscribe(handler) {
    this.handlers.push(handler);
    return () => this.unsubscribe(handler);
  }
  /**
   * Unsubscribes a handler from the state machine.
   *
   * @param handler - The handler to unsubscribe.
   */
  unsubscribe(handler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }
  /**
   * Notifies handlers of a state change.
   *
   * @param state - The state to notify handlers of.
   */
  notifyHandlers(state) {
    const serialisedState = this.serialise(state);
    for (const handler of this.handlers) {
      handler(serialisedState);
    }
  }
  /**
   * Starts the state machine.
   *
   * @param serialisedState - The serialised state to start the state machine in.
   */
  start(serialisedState) {
    if (this.isRunning) {
      return;
    }
    this.rootState.enter({
      serialisedState,
      event: { type: "START" }
    });
    this.notifyHandlers(this.rootState);
  }
  /**
   * Stops the state machine.
   */
  stop() {
    this.rootState.exit({ event: { type: "STOP" } });
  }
  /**
   * Returns the current state of the state machine as a serialised state object.
   *
   */
  value() {
    return this.serialise(this.rootState);
  }
  /**
   * Sends an event to the state machine.
   *
   * @param event - The event to send.
   * @throws {StateMachineError} When the state machine is not running or event handling fails
   */
  send(event) {
    if (!this.isRunning) {
      throw new StateMachineError(
        "Cannot send events when state machine is not running"
      );
    }
    try {
      this.rootState.notifyHandlers({ event });
    } catch (error) {
      throw new StateMachineError(
        `Failed to handle event "${event.type}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Serialises the state of the state machine into a serialised state object.
   *
   * @param state - The state to serialise.
   * @returns The serialised state.
   */
  serialise(state) {
    const activeChildren = state.getActiveChildren();
    if (activeChildren.length === 1) {
      return activeChildren[0].id;
    }
    return state.getActiveChildren().reduce(
      (acc, state2) => {
        acc[state2.id] = this.serialise(state2);
        return acc;
      },
      {}
    );
  }
};

// src/machineFactory.ts
function machineFactory(config) {
  return new StateMachine(config);
}
export {
  machineFactory
};
