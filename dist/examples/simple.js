"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const __1 = require("../");
// Create a state machine using the machineFactory function
const machine = (0, __1.machineFactory)({
    // Define the events that the state machine can handle
    events: {},
    // Define the initial context of the state machine
    context: {
        x: 0, // Initial value for context variable 'x'
        y: 0, // Initial value for context variable 'y'
        z: 0, // Initial value for context variable 'z'
    },
    // Define the type of state machine as parallel (states can operate concurrently)
    type: 'parallel',
    states: {
        // State group 'a' is a sequential state machine (states transition one after another)
        a: {
            type: 'sequential',
            states: {
                // Initial state 'aa' of state group 'a'
                aa: {
                    on: {
                        // Transition from 'aa' to 'ab' on 'EVENT_A' if the condition is met
                        EVENT_A: ({ transition, context }) => {
                            // Only transition if the value of context.x is greater than 0
                            if (context.x > 0) {
                                return transition('ab');
                            }
                            // Log a message if the condition is not met
                            console.log(chalk_1.default.yellow('Condition not met to transition to ab'));
                        },
                    },
                },
                // State 'ab' of state group 'a'
                ab: {
                    // Action to perform when entering state 'ab'
                    onEntry: ({ context }) => {
                        console.log(chalk_1.default.green(`Entering ab with x: ${context.x}`));
                    },
                    on: {
                        // Transition from 'ab' to 'ac' on 'EVENT_B'
                        EVENT_B: ({ transition }) => transition('ac'),
                    },
                },
                // State 'ac' of state group 'a'
                ac: {
                    // Action to perform when entering state 'ac'
                    onEntry: ({ context, updateContext }) => {
                        console.log(chalk_1.default.blue(`Entering ac, updating y and z`));
                        // Update context values y and z when entering state 'ac'
                        updateContext({ y: context.y + 10, z: context.z + 5 });
                    },
                },
            },
        },
        // State group 'b' is a parallel state machine (multiple states can be active concurrently)
        b: {
            type: 'parallel',
            states: {
                // State group 'ba' within parallel state 'b'
                ba: {
                    states: {
                        // Initial state 'baa' of state group 'ba'
                        baa: {
                            on: {
                                // Transition from 'baa' to 'bab' on 'EVENT_C'
                                EVENT_C: ({ transition }) => transition('bab'),
                            },
                        },
                        // State 'bab' of state group 'ba'
                        bab: {
                            // Action to perform when entering state 'bab'
                            onEntry: ({ context }) => {
                                console.log(chalk_1.default.red(`Entered bab with updated context: ${JSON.stringify(context)}`));
                            },
                        },
                    },
                },
                // State 'bb' within parallel state 'b'
                bb: {
                    on: {
                        // Transition from 'bb' to 'bc' on 'EVENT_D'
                        EVENT_D: ({ transition }) => transition('bc'),
                    },
                },
                // State 'bc' within parallel state 'b'
                bc: {
                    // Action to perform when entering state 'bc'
                    onEntry: ({ context }) => {
                        console.log(chalk_1.default.cyan('Entering bc with current context:', JSON.stringify(context)));
                    },
                },
            },
        },
        // State group 'c' with multiple sequential states
        c: {
            states: {
                // Initial state 'ca' of state group 'c'
                ca: {
                    type: 'initial',
                    // Action to perform when entering the initial state 'ca'
                    onEntry: ({ context }) => {
                        console.log(chalk_1.default.green('Initial state ca of state c, x:', context.x));
                    },
                    on: {
                        // Transition from 'ca' to 'cb' on 'EVENT_B'
                        EVENT_B: ({ transition }) => transition('cb'),
                    },
                },
                // State 'cb' of state group 'c'
                cb: {
                    // Action to perform when entering state 'cb'
                    onEntry: ({ context, updateContext }) => {
                        console.log(chalk_1.default.yellow('Entering cb, modifying context x and y'));
                        // Update context values x and y when entering state 'cb'
                        updateContext({ x: context.x + 5, y: context.y - 3 });
                    },
                    on: {
                        // Transition from 'cb' to 'cc' on 'EVENT_C'
                        EVENT_C: ({ transition }) => transition('cc'),
                    },
                },
                // Final state 'cc' of state group 'c'
                cc: {
                    // Action to perform when entering final state 'cc'
                    onEntry: ({ context }) => {
                        console.log(chalk_1.default.magenta('Final state cc with context:', context));
                    },
                },
            },
        },
    },
});
// Subscribe to state changes and log the current state whenever it changes
machine.subscribe((state) => {
    console.log(chalk_1.default.magenta('State'), JSON.stringify(state, null, 2));
});
// Send various events to trigger state transitions in the state machine
machine.send({ type: 'EVENT_A' });
machine.send({ type: 'EVENT_B' });
machine.send({ type: 'EVENT_C' });
machine.send({ type: 'EVENT_D' });
//# sourceMappingURL=simple.js.map