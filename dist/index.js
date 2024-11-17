// src/stateMachine.ts
var StateMachine = class _StateMachine {
  constructor(config, machineContext) {
    this.states = {};
    this.activeStates = [];
    this.timers = [];
    this.config = config;
    this.type = config.states ? config.type ?? "sequential" : "leaf";
    this.onEntry = config.onEntry;
    this.onExit = config.onExit;
    this.machineContext = machineContext;
  }
  initialise() {
    if (this.config.states) {
      const stateKeys = Object.keys(this.config.states);
      let initialState = null;
      for (const stateName of stateKeys) {
        const stateConfig = this.config.states[stateName];
        this.states[stateName] = new _StateMachine(
          stateConfig,
          this.machineContext
        );
        if (stateConfig.type === "initial") {
          if (initialState) {
            throw new Error("Multiple initial states found");
          }
          initialState = stateName;
        }
      }
      if (initialState) {
        this.transition(initialState);
      } else {
        this.transition(stateKeys[0]);
      }
    }
  }
  transition(stateName) {
    const state = this.states[stateName];
    if (!state) {
      throw new Error(`State ${stateName} not found`);
    }
    if (!this.activeStates.includes(stateName)) {
      this.activeStates.push(stateName);
    }
  }
  transitionAfter(stateName, ms, callback) {
  }
  send(event) {
  }
  getState() {
    return null;
  }
  dispose() {
  }
};

// src/stateMachineRoot.ts
var StateMachineRoot = class {
  constructor(config) {
    this.config = config;
    this.subscriptions = [];
    this.isRunning = false;
    this.context = config.context;
    this.stateMap = /* @__PURE__ */ new Map();
    this.state = new StateMachine(
      this.config,
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
        stateMap: this.stateMap
      }
    );
  }
  /**
   * Starts the state machine.
   * Initializes the state machine and notifies subscribers if not already running.
   */
  start() {
    if (this.isRunning) {
      return;
    }
    this.state.initialise();
    this.notifySubscribers();
    this.isRunning = true;
  }
  /**
   * Stops the state machine and performs cleanup.
   */
  stop() {
    this.isRunning = false;
    this.state.dispose();
  }
  /**
   * Updates the context object with new values.
   * @param context - Partial context object to merge with existing context
   */
  updateContext(context) {
    this.context = structuredClone({ ...this.context, ...context });
  }
  /**
   * Subscribes to state machine updates.
   * @param handler - Callback function that receives current state and context
   * @returns Unsubscribe function
   */
  subscribe(handler) {
    this.subscriptions.push(handler);
    return () => this.unsubscribe(handler);
  }
  /**
   * Unsubscribes a handler from state machine updates.
   * @param handler - The handler function to remove
   */
  unsubscribe(handler) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }
  /**
   * Notifies all subscribers of the current state and context.
   */
  notifySubscribers() {
    const state = this.getState();
    for (const handler of this.subscriptions) {
      handler(state, this.context);
    }
  }
  /**
   * Returns the current state of the state machine.
   * @returns Current machine state
   */
  getState() {
    return this.state.getState();
  }
  /**
   * Returns the current context object.
   * @returns Current context
   */
  getContext() {
    return this.context;
  }
  /**
   * Sends an event to the state machine for processing.
   * @param event - The event to process
   * @throws Error if state machine is not running
   */
  send(event) {
    if (!this.isRunning) {
      throw new Error("State machine is not running");
    }
    this.state.send(event);
  }
};

// src/machineFactory.ts
function machineFactory(config) {
  return new StateMachineRoot(config);
}
export {
  machineFactory
};
