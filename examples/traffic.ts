import { MachineNode } from '../src/MachineNode';

const machine = new MachineNode({
  id: 'root',
  context: {
    goPeriod: 5_000,
    stopPeriod: 5_000,
    readyStopPeriod: 3_000,
    readyGoPeriod: 3_000,
  },
});

machine.appendChild({
  id: 'readyStop',
  onEntry: ({ after, context }) => after(context.readyStopPeriod, () => 'stop'),
});

machine.appendChild({
  id: 'stop',
  onEntry: ({ after, context }) => after(context.stopPeriod, () => 'readyGo'),
});

machine.appendChild({
  id: 'readyGo',
  onEntry: ({ after, context }) => after(context.readyGoPeriod, () => 'go'),
});

machine.appendChild({
  id: 'go',
  onEntry: ({ after, context }) => after(context.goPeriod, () => 'readyStop'),
});

machine.initialChildId = 'readyStop';

machine.onTransition = ({ state, context }) => {
  console.log('Transition:', state, context);
};

machine.enter();
