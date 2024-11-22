export type MachineEvent = {
  type: string;
  data?: unknown;
};

type AfterCallback = () => void;

export type EntryHandler = (params: {
  after: (ms: number, callback: AfterCallback) => void;
}) => void;

export type ExitHandler = () => void;

export type EventHandler<E, S> = (event: E) => S;

type EventHandlers<E extends MachineEvent, S> = {
  [K in E['type']]: EventHandler<Extract<E, { type: K }>, S>;
};

export class State<E extends MachineEvent, S extends string> {
  private children: State<E, S>[] = [];
  private parentState: State<E, S> | null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private listeners: EventHandlers<E, S> = {} as EventHandlers<E, S>;

  readonly id: S;
  onEntry?: EntryHandler;
  onExit?: ExitHandler;
  parallel = false;
  initial: boolean = false;
  active: boolean = false;

  constructor(parentState: State<E, S> | null, id: S) {
    this.id = id;
    this.parentState = parentState;
  }

  addChild(child: State<E, S>) {
    this.children.push(child);
  }

  setListener<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, S>,
  ) {
    this.listeners[eventType] = handler;
  }

  notifyListeners(event: MachineEvent, trickleDown: boolean = true) {
    const eventType = event.type as E['type'];

    const listener = this.listeners[eventType];

    if (listener) {
      const targetId = listener(event as Extract<E, MachineEvent>);

      if (targetId) {
        const sibling = this.parentState?.getChildById(targetId);

        if (sibling) {
          this.exit();
          sibling.enter();
        }
      }
    }

    if (trickleDown) {
      for (const child of this.children) {
        child.notifyListeners(event);
      }
    }
  }

  on<T extends string>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, S>,
  ) {
    this.setListener(eventType, handler);
  }

  enter() {
    //TODO: add history flag
    this.active = true;

    const after = this.after.bind(this);

    if (this.onEntry) {
      this.onEntry({ after });
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

      if (initialChildren.length > 0) {
        console.warn(
          `Multiple initial states found for state ${this.id}. Using first match.`,
        );
      }

      const initialChild = initialChildren[0] ?? this.children[0];

      initialChild.enter();
    }
  }

  exit() {
    this.active = false;

    for (const timer of this.timers) {
      clearTimeout(timer);
    }

    if (this.onExit) {
      this.onExit();
    }

    for (const child of this.children) {
      if (child.active) {
        child.exit();
      }
    }
  }

  after(ms: number, callback: AfterCallback) {
    const timer = setTimeout(() => {
      callback();
    }, ms);

    this.timers.push(timer);
  }

  getActiveChildren() {
    return this.children.filter((child) => child.active);
  }

  getChildById(id: S) {
    return this.children.find((child) => child.id === id);
  }

  serialise(): SerialisedState {
    if (!this.active) {
      return null;
    }

    const activeChildren = this.getActiveChildren();

    return activeChildren.reduce((acc, state) => {
      const childStates = state.getActiveChildren();
      if (childStates.length === 1) {
        acc[state.id] = childStates[0].id;
      } else {
        acc[state.id] = state.serialise();
      }

      return acc;
    }, {} as SerialisedState);
  }
}

type SerialisedState = any;
