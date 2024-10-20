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

// src/State.ts
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
  listeners = {};
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
   */
  addChild(child) {
    this.children.push(child);
    try {
      this.machineContext.stateRegistry.set(child.id, child);
    } catch {
      console.warn(
        `State with id ${child.id} already exists. Ignoring duplicate state.`
      );
    }
  }
  /**
   * Registers an event handler for a specific event type.
   *
   * @param eventType - The type of event to listen for.
   * @param handler - The function to call when the specified event is received.
   */
  setListener(eventType, handler) {
    this.listeners[eventType] = handler;
  }
  /**
   * Notifies listeners of an event and propagates it to child states if specified.
   */
  notifyListeners(event, trickleDown = true) {
    if (this.active) {
      const listener = this.listeners[event.type];
      if (listener) {
        const targetId = listener({
          event
        });
        if (targetId) {
          this.transitionTo(targetId);
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
   */
  transitionTo(targetId) {
    const targetState = this.getStateById(targetId);
    this.exit();
    targetState.enter();
    this.machineContext.notifyListeners();
  }
  /**
   * Notifies all active child states of an event.
   *
   * @param event - The event to notify the child states of.
   */
  notifyChildren(event) {
    for (const child of this.getActiveChildren()) {
      child.notifyListeners(event);
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
    this.setListener(eventType, handler);
  }
  /**
   * Enters the state, making it active and handling any necessary transitions or child state entries.
   */
  enter(serialisedState) {
    this.active = true;
    const after = this.after.bind(this);
    if (this.onEntry) {
      const targetId = this.onEntry({ after });
      if (targetId) {
        this.transitionTo(targetId);
      }
    }
    if (serialisedState) {
      if (typeof serialisedState === "string") {
        this.transitionTo(serialisedState);
      } else if (!this.parallel && this.children.length > 0) {
        this.children.forEach((child) => {
          child.enter(serialisedState[child.id]);
        });
      }
      return;
    }
    if (this.children.length === 0) {
      return;
    }
    if (this.parallel) {
      for (const child of this.children) {
        child.enter();
      }
    } else {
      const initialChildren = this.children.filter((child) => child.initial);
      if (initialChildren.length > 1) {
        console.warn(
          `Multiple initial states found for state ${this.id}. Using first match.`
        );
      }
      const initialChild = initialChildren[0] ?? this.children[0];
      initialChild.enter();
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
  exit(preserveHistory) {
    if (!preserveHistory) {
      this.active = false;
    }
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.onExit?.();
    const historyToPreserve = preserveHistory === "deep" ? "deep" : this.history;
    this.children.forEach((child) => {
      if (child.active) {
        child.exit(historyToPreserve);
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
    const timer = setTimeout(() => {
      const stateId = callback();
      this.transitionTo(stateId);
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
   */
  getStateById(id) {
    const state = this.getChildById(id) ?? this.getSiblingById(id) ?? this.machineContext.stateRegistry.get(id);
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    return state;
  }
};

// src/StateMachine.ts
var StateMachine = class {
  listeners;
  stateRegistry = /* @__PURE__ */ new Map();
  rootState;
  get isRunning() {
    return this.rootState.active;
  }
  constructor(rootConfig) {
    this.listeners = [];
    this.rootState = this.buildState(rootConfig, null, "root");
  }
  buildState(config, parent, id) {
    const machineContext = {
      stateRegistry: this.stateRegistry,
      notifyListeners: () => this.notifyListeners(this.rootState)
    };
    const state = new State(parent, id, machineContext);
    state.parallel = config.parallel ?? false;
    state.onEntry = config.onEntry;
    state.onExit = config.onExit;
    state.initial = config.initial ?? false;
    for (const event in config.on) {
      const handler = config.on[event];
      state.setListener(event, handler);
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
  getStateById(id) {
    return this.stateRegistry.get(id);
  }
  subscribe(handler) {
    this.listeners.push(handler);
    return () => this.unsubscribe(handler);
  }
  unsubscribe(handler) {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }
  notifyListeners(state) {
    const serialisedState = this.serialise(state);
    for (const handler of this.listeners) {
      handler(serialisedState);
    }
  }
  start(serialisedState) {
    if (this.isRunning) {
      return;
    }
    this.rootState.enter(serialisedState);
    this.notifyListeners(this.rootState);
  }
  stop() {
    this.rootState.exit();
  }
  value() {
    return this.serialise(this.rootState);
  }
  send(event) {
    if (!this.isRunning) {
      throw new Error("State machine is not running");
    }
    this.rootState.notifyListeners(event);
  }
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  machineFactory
});
