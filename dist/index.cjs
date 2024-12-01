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

// src/lib/invariant.ts
var InvariantError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InvariantError";
  }
};
function invariant(condition, message) {
  if (condition === false || condition === null || condition === void 0) {
    const errorMessage = typeof message === "function" ? message() : message;
    throw new InvariantError(errorMessage);
  }
}

// src/MachineNode.ts
var StateRegistryError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "StateRegistryError";
  }
};
var MachineNode = class _MachineNode {
  #context;
  #children = [];
  #parentStateNode;
  #timers = [];
  #handlers = {};
  #active = false;
  #initialChildId;
  #history;
  #parallel = false;
  #id;
  onEntry;
  onExit;
  onTransition;
  get id() {
    return this.#id;
  }
  get active() {
    return this.#active;
  }
  get parallel() {
    return this.#parallel;
  }
  get initialChildId() {
    return this.#initialChildId;
  }
  set initialChildId(value) {
    this.#initialChildId = value;
  }
  constructor(options) {
    this.#id = options.id;
    this.#context = options.context;
    this.#parallel = options.parallel ?? false;
    this.onEntry = options.onEntry;
    this.onExit = options.onExit;
    if (options.on) {
      for (const [eventType, handler] of Object.entries(options.on)) {
        this.setTransitionHandler(
          eventType,
          handler
        );
      }
    }
  }
  addChildState(child, initial) {
    if (this.#children.some((c) => c.id === child.id)) {
      throw new StateRegistryError(
        `Child state with ID ${child.id} already exists`
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
  removeChildState(child) {
    child.#parentStateNode = void 0;
    this.#children = this.#children.filter((c) => c !== child);
    if (this.#initialChildId === child.id) {
      this.#initialChildId = void 0;
    }
    return this;
  }
  /**
   * Appends a child state to the current state node.
   *
   * @param params - The parameters for the child state.
   * @returns The child state node.
   */
  appendChild(params) {
    const child = new _MachineNode({
      id: params.id,
      context: this.#context,
      onEntry: params.onEntry,
      onExit: params.onExit,
      on: params.on
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
  setTransitionHandler(eventType, handler) {
    this.#handlers[eventType] = handler;
  }
  /**
   * Dispatches an event to the current state node.
   *
   * @param event - The event to dispatch.
   */
  dispatch(event) {
    if (this.#active) {
      const handler = this.#handlers[event.type];
      if (handler) {
        const targetId = handler({
          event,
          context: this.getContext(),
          setContext: this.setContext.bind(this),
          updateContext: this.updateContext.bind(this)
        });
        if (targetId) {
          this.transition(targetId);
        }
      }
      for (const child of this.#children) {
        child.dispatch(event);
      }
    } else {
      console.warn("State is not active, skipping event dispatch", event);
    }
  }
  async transition(targetId) {
    let targetState = this.getStateById(targetId, this);
    let commonAncestor = this.#parentStateNode;
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
    invariant(commonAncestor, "Common ancestor not found");
    let currentState = this;
    const statesToEnter = [];
    while (currentState !== commonAncestor) {
      currentState.exit();
      currentState = currentState.#parentStateNode;
      statesToEnter.push(currentState);
    }
    statesToEnter.reverse().forEach((state) => state.enter());
    await targetState.enter();
    for (let currentState2 = targetState.#parentStateNode; currentState2; currentState2 = currentState2.#parentStateNode) {
      currentState2.onTransition?.({
        state: currentState2.serialiseState(),
        context: this.getContext()
      });
    }
  }
  async enter() {
    console.log("Entering state", this.id);
    this.#active = true;
    const context = this.getContext();
    const after = this.after.bind(this);
    const entryPromise = Promise.resolve(
      this.onEntry?.({
        after,
        context
      })
    ).then((targetId) => {
      if (targetId) {
        this.transition(targetId);
      }
    });
    if (this.#children.length === 0) {
      return;
    }
    const childEnterPromises = [];
    if (this.parallel) {
      for (const child of this.#children) {
        childEnterPromises.push(child.enter());
      }
    } else {
      const initialChild = this.#children.find((child) => child.id === this.initialChildId) ?? this.#children[0];
      if (!initialChild) {
        throw new Error(`No initial child state found for state ${this.id}`);
      }
      childEnterPromises.push(initialChild.enter());
    }
    await Promise.all([entryPromise, ...childEnterPromises]);
  }
  async exit(preserveHistory) {
    console.log("Exiting state", this.id);
    if (!preserveHistory) {
      this.cleanup();
      this.#active = false;
    }
    this.#timers.forEach(clearTimeout);
    this.#timers = [];
    const exitPromise = this.onExit?.({
      context: this.getContext()
    });
    const historyToPreserve = preserveHistory === "deep" ? "deep" : this.#history;
    const childExitPromises = this.#children.filter((child) => child.active).map((child) => child.exit(historyToPreserve));
    const promises = [exitPromise, ...childExitPromises];
    await Promise.all(promises);
  }
  after(ms, callback) {
    console.log("Scheduling callback", ms, callback);
    const timer = setTimeout(async () => {
      const stateId = await callback({
        context: this.getContext(),
        setContext: this.setContext.bind(this),
        updateContext: this.updateContext.bind(this)
      });
      if (stateId) {
        this.transition(stateId);
      }
    }, ms);
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
  getActiveChildren() {
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
  getStateById(id, current = this, excludeId) {
    if (current.id === excludeId) {
      return void 0;
    }
    if (current.id === id) {
      return current;
    }
    const queue = [...current.#children];
    while (queue.length > 0) {
      const node = queue.shift();
      if (node.id === excludeId) {
        continue;
      }
      if (node.id === id) {
        return node;
      }
      queue.push(...node.#children);
    }
  }
  cleanup() {
    this.#timers.forEach(clearTimeout);
    this.#timers = [];
    this.#handlers = {};
    this.#children.forEach((child) => child.cleanup());
  }
  setContext(context) {
    if (this.#context !== void 0) {
      this.#context = context;
    } else if (this.#parentStateNode) {
      this.#parentStateNode.setContext(context);
    } else {
      throw new Error("Context not found in current or parent state nodes");
    }
  }
  getContext() {
    return this.#context ?? this.#parentStateNode?.getContext();
  }
  updateContext(callback) {
    this.setContext(callback(this.getContext()));
  }
  /**
   * Serialises the state of the state machine into a serialised state object.
   *
   * @param state - The state to serialise.
   * @returns The serialised state.
   */
  serialiseState(state = this) {
    const activeChildren = state.getActiveChildren();
    if (activeChildren.length === 1) {
      return activeChildren[0].id;
    }
    return state.getActiveChildren().reduce(
      (acc, state2) => {
        acc[state2.id] = state2.serialiseState();
        return acc;
      },
      {}
    );
  }
};

// src/machineFactory.ts
function machineFactory(config) {
  return new MachineNode({ id: "root", ...config });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  machineFactory
});
