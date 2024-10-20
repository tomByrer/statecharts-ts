import { Machine } from '../machineFactory';
import { useState, useEffect } from 'react';

export function useMachine<C extends any>(machine: Machine<C>) {
  const [state, setState] = useState(machine.getState());
  const [context, setContext] = useState(machine.getContext());

  useEffect(() => {
    return machine.subscribe((state, context) => {
      setState(state);
      setContext(context);
    });
  }, [machine]);

  return { state, context, send: machine.send };
}
