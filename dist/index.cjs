"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  machineFactory: () => machineFactory
});
module.exports = __toCommonJS(src_exports);

// src/EventBus.ts
var EventBus = class {
  constructor() {
    this.subscriptions = [];
  }
  on(event, callback) {
    this.subscriptions.push(callback);
  }
  off(event, callback) {
    this.subscriptions = this.subscriptions.filter((c) => c !== callback);
  }
  send(event) {
    this.subscriptions.forEach((callback) => callback(event));
  }
  clear() {
    this.subscriptions = [];
  }
};

// src/StateMachine.ts
var StateMachine = class _StateMachine {
  constructor(config, machineContext, parentState) {
    this.states = {};
    this.activeState = null;
    this.timers = [];
    this.config = config;
    this.type = config.states ? config.type ?? "sequential" : "leaf";
    this.onEntry = config.onEntry;
    this.onExit = config.onExit;
    this.machineContext = machineContext;
    this.parentState = parentState;
    if (this.config.states) {
      const stateKeys = Object.keys(this.config.states);
      let initialState = null;
      for (const stateName of stateKeys) {
        const stateConfig = this.config.states[stateName];
        this.states[stateName] = new _StateMachine(
          stateConfig,
          this.machineContext,
          this
        );
        if (this.type !== "sequential") {
          continue;
        }
        if (stateConfig.type === "initial") {
          if (initialState) {
            throw new Error("Multiple initial states found");
          }
          initialState = stateName;
        }
      }
      this.activeState = initialState;
    }
  }
  enter() {
    if (this.onEntry) {
      this.onEntry({
        after: this.after.bind(this),
        context: this.machineContext.context,
        updateContext: this.machineContext.updateContext
      });
    }
    if (this.type === "sequential") {
      this.transition(this.activeState);
    }
  }
  exit() {
    if (this.type === "sequential") {
      const state = this.states[this.activeState];
      state.exit();
    } else if (this.type === "parallel") {
      for (const stateName in this.states) {
        this.states[stateName].exit();
      }
    }
    this.onExit?.({
      context: this.machineContext.context,
      updateContext: this.machineContext.updateContext
    });
  }
  transition(stateName) {
    if (this.type !== "sequential") {
      throw new Error("Transitioning is not allowed in non-sequential states");
    }
    if (this.activeState) {
      this.states[this.activeState].exit();
    }
    const state = this.states[stateName];
    if (!state) {
      throw new Error(`State ${stateName} not found`);
    }
    state.enter();
    this.machineContext.onTransition?.(stateName);
  }
  after(ms, callback) {
    const timer = setTimeout(() => {
      const nextState = callback?.({
        context: this.machineContext.context,
        updateContext: this.machineContext.updateContext
      });
      if (nextState) {
        this.parentState?.transition(nextState);
      }
    }, ms);
    this.timers.push(timer);
    return this.activeState;
  }
  send(event) {
    this.machineContext.eventBus.send(event);
  }
  getState() {
    return null;
  }
};

// src/StateMachineRoot.ts
var StateMachineRoot = class {
  constructor(config) {
    this.config = config;
    this.subscriptions = [];
    this.isRunning = false;
    this.context = config.context;
    this.eventBus = new EventBus();
    this.state = new StateMachine(
      this.config,
      {
        context: this.context,
        updateContext: this.updateContext.bind(this),
        eventBus: this.eventBus,
        onTransition: this.notifySubscribers.bind(this)
      }
    );
    this.subscriptions = [];
  }
  subscribe(handler) {
    this.subscriptions.push(handler);
  }
  unsubscribe(handler) {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
  }
  notifySubscribers(state) {
    for (const handler of this.subscriptions) {
      handler(state, this.context);
    }
  }
  /**
   * Starts the state machine.
   * Initializes the state machine and notifies subscribers if not already running.
   */
  start() {
    if (this.isRunning) {
      return;
    }
    this.state.enter();
    this.isRunning = true;
  }
  /**
   * Stops the state machine and performs cleanup.
   */
  stop() {
    this.isRunning = false;
    this.state.exit();
  }
  /**
   * Updates the context object with new values.
   * @param context - Partial context object to merge with existing context
   */
  updateContext(context) {
    this.context = structuredClone({ ...this.context, ...context });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  machineFactory
});
