"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineFactory = machineFactory;
const StateMachineRoot_1 = require("./StateMachineRoot");
/**
 * Factory function to create a state machine.
 * @param config - The configuration for the state machine.
 * @returns An object with methods to get the state and send events.
 */
function machineFactory(config) {
    return new StateMachineRoot_1.StateMachineRoot(config);
}
//# sourceMappingURL=machineFactory.js.map