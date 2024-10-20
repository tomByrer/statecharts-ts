"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineRoot = void 0;
const StateMachine_1 = require("./StateMachine");
/**
 * Class representing the root state machine.
 * @template C - The type of the context object.
 */
class StateMachineRoot {
    constructor(config) {
        this.config = config;
        this.subscriptions = [];
        this.context = config.context;
        this.state = new StateMachine_1.StateMachine(config, {
            name: '$',
            transition: () => { },
            getPathToState: () => [],
            onTransition: this.notifySubscribers.bind(this),
        }, {
            context: this.context,
            updateContext: this.updateContext.bind(this),
        });
    }
    updateContext(context) {
        this.context = structuredClone(Object.assign(Object.assign({}, this.context), context));
    }
    subscribe(handler) {
        this.subscriptions.push(handler);
        return () => this.unsubscribe(handler);
    }
    unsubscribe(handler) {
        this.subscriptions = this.subscriptions.filter((h) => h !== handler);
    }
    notifySubscribers() {
        const state = this.getState();
        for (const handler of this.subscriptions) {
            handler(state, this.context);
        }
    }
    getState() {
        return this.state.getState();
    }
    getContext() {
        return this.context;
    }
    send(event) {
        this.state.send(event);
    }
}
exports.StateMachineRoot = StateMachineRoot;
//# sourceMappingURL=StateMachineRoot.js.map