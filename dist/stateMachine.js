"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Class representing a state machine.
 */
class StateMachine {
    /**
     * Creates an instance of the StateMachine.
     * @param stateDef - The state definition for the machine.
     * @param parentState - The parent state, if any.
     * @param context - The context for the state machine.
     */
    constructor(stateDef, parentState, rootState) {
        var _a, _b;
        this.stateDef = stateDef;
        this.parentState = parentState;
        this.rootState = rootState;
        this.activeStates = [];
        this.states = {};
        this.timers = [];
        this.name = (_a = parentState === null || parentState === void 0 ? void 0 : parentState.name) !== null && _a !== void 0 ? _a : '$';
        this.type = stateDef.states ? (_b = stateDef.type) !== null && _b !== void 0 ? _b : 'sequential' : 'leaf';
        this.onEntry = stateDef.onEntry;
        this.onExit = stateDef.onExit;
        this.initializeStates();
    }
    /**
     * Initializes the states of the state machine.
     * Sets up the initial active states based on the state type.
     */
    initializeStates() {
        var _a, _b, _c;
        const stateEntries = Object.entries((_a = this.stateDef.states) !== null && _a !== void 0 ? _a : {});
        if (this.stateDef.type === 'parallel') {
            this.activeStates = stateEntries.map(([key]) => key);
        }
        else if (this.type === 'sequential') {
            const initialState = stateEntries.find(([, state]) => state.type === 'initial');
            const [firstStateKey] = (_b = stateEntries[0]) !== null && _b !== void 0 ? _b : [];
            this.activeStates = initialState
                ? [initialState[0]]
                : firstStateKey
                    ? [firstStateKey]
                    : [];
            if (this.activeStates.length === 0) {
                throw new Error('No initial state found');
            }
        }
        this.states = stateEntries.reduce((acc, [key, value]) => {
            var _a;
            return (Object.assign(Object.assign({}, acc), { [key]: new StateMachine(value, {
                    name: key,
                    transition: this.transition.bind(this),
                    getPathToState: this.getPathToState.bind(this),
                    onTransition: (_a = this.parentState) === null || _a === void 0 ? void 0 : _a.onTransition,
                }, this.rootState) }));
        }, {});
        for (const stateName of this.activeStates) {
            const state = this.states[stateName];
            console.log(chalk_1.default.green('Entering state'), stateName);
            (_c = state.onEntry) === null || _c === void 0 ? void 0 : _c.call(state, {
                transitionAfter: this.transitionAfter.bind(this),
                context: this.rootState.context,
                updateContext: this.rootState.updateContext,
            });
        }
    }
    /**
     * Gets the current state of the state machine.
     * @returns The current state object or null.
     */
    getState() {
        if (this.type === 'leaf') {
            return {};
        }
        if (this.type === 'sequential') {
            const activeStateName = this.activeStates[0];
            if (!activeStateName) {
                console.warn(chalk_1.default.yellow('No active state found'), this.getPathToState().join('.'), this.type);
                return null;
            }
            const activeState = this.states[activeStateName];
            if (activeState.type === 'leaf') {
                return activeStateName;
            }
        }
        return this.activeStates.reduce((acc, stateName) => (Object.assign(Object.assign({}, acc), { [stateName]: this.states[stateName].getState() })), {});
    }
    /**
     * Gets the path to the current state.
     * @returns An array representing the path to the current state.
     */
    getPathToState() {
        var _a;
        return ((_a = this.parentState) === null || _a === void 0 ? void 0 : _a.name)
            ? [...this.parentState.getPathToState(), this.parentState.name]
            : ['$'];
    }
    /**
     * Transitions to a new state.
     * @param stateName - The name of the state to transition to.
     */
    transition(stateName) {
        var _a, _b, _c, _d, _e;
        const stateEntries = Object.entries((_a = this.stateDef.states) !== null && _a !== void 0 ? _a : {});
        const nextState = stateEntries.find((state) => state[0] === stateName);
        if (nextState) {
            this.dispose();
            this.activeStates = [stateName];
            const nextStateDef = nextState[1];
            console.log(chalk_1.default.green('Entering state'), stateName);
            (_b = nextStateDef.onEntry) === null || _b === void 0 ? void 0 : _b.call(nextStateDef, {
                transitionAfter: this.transitionAfter.bind(this),
                context: this.rootState.context,
                updateContext: this.rootState.updateContext,
            });
            (_d = (_c = this.parentState) === null || _c === void 0 ? void 0 : _c.onTransition) === null || _d === void 0 ? void 0 : _d.call(_c, stateName);
        }
        else {
            (_e = this.parentState) === null || _e === void 0 ? void 0 : _e.transition(stateName);
        }
    }
    /**
     * Sends an event to the state machine.
     * @param event - The event to send.
     */
    send(event) {
        var _a, _b;
        const stateTransitionHandlers = (_a = this.stateDef.on) !== null && _a !== void 0 ? _a : {};
        const handler = stateTransitionHandlers[event.type];
        if (handler) {
            handler({
                event,
                transition: this.transition.bind(this),
                context: this.rootState.context,
            });
        }
        else {
            for (const stateName of this.activeStates) {
                (_b = this.states[stateName]) === null || _b === void 0 ? void 0 : _b.send(event);
            }
        }
    }
    /**
     * Transitions to a new state after a delay.
     * @param stateName - The name of the state to transition to.
     * @param ms - The delay in milliseconds.
     * @param callback - Optional callback to execute after the delay.
     */
    transitionAfter(stateName, ms, callback) {
        const timeout = setTimeout(() => {
            callback === null || callback === void 0 ? void 0 : callback({ context: this.rootState.context });
            this.transition(stateName);
        }, ms);
        this.timers.push(timeout);
    }
    /**
     * Disposes of the current state and cleans up resources.
     */
    dispose() {
        var _a;
        const currentState = this.states[this.activeStates[0]];
        if (!currentState) {
            console.warn(chalk_1.default.yellow('No current state found'), this.getPathToState().join('.'));
            return;
        }
        console.log(chalk_1.default.red('Exiting state'), this.activeStates[0]);
        for (const timer of this.timers) {
            clearTimeout(timer);
        }
        // dispose descendants
        for (const stateName of this.activeStates) {
            const state = this.states[stateName];
            state.dispose();
        }
        (_a = currentState.onExit) === null || _a === void 0 ? void 0 : _a.call(currentState, {
            context: this.rootState.context,
            updateContext: this.rootState.updateContext,
        });
    }
}
exports.StateMachine = StateMachine;
//# sourceMappingURL=StateMachine.js.map