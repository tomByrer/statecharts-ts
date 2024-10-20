"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMachine = useMachine;
const react_1 = require("react");
function useMachine(machine) {
    const [state, setState] = (0, react_1.useState)(machine.getState());
    const [context, setContext] = (0, react_1.useState)(machine.getContext());
    (0, react_1.useEffect)(() => {
        return machine.subscribe((state, context) => {
            setState(state);
            setContext(context);
        });
    }, [machine]);
    return { state, context, send: machine.send };
}
//# sourceMappingURL=useMachine.js.map