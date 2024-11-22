import { type MachineContext } from './StateMachine';

export type MachineEvent = {
  type: string;
  data?: unknown;
};

type AfterCallback<S> = () => S;

export type EntryHandler<S> = (params: {
  after: (ms: number, callback: AfterCallback<S>) => void;
}) => void;

export type ExitHandler = () => void;

export type EventHandler<E, S> = (event: E) => S;

type EventHandlers<E extends MachineEvent, S> = {
  [K in E['type']]: EventHandler<Extract<E, { type: K }>, S>;
};

export type StateHierarchy = {
  [key: string]: StateHierarchy | string;
};

export class State<E extends MachineEvent, S extends string> {
  private children: State<E, S>[] = [];
  private parentState: State<E, S> | null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private listeners: EventHandlers<E, S> = {} as EventHandlers<E, S>;
  private machineContext: MachineContext<E, S>;

  readonly id: S;
  onEntry?: EntryHandler<S>;
  onExit?: ExitHandler;
  parallel = false;
  initial: boolean = false;
  active: boolean = false;

  constructor(
    parentState: State<E, S> | null,
    id: S,
    machineContext: MachineContext<E, S>,
  ) {
    this.id = id;
    this.parentState = parentState;
    this.machineContext = machineContext;
  }

  addChild(child: State<E, S>) {
    this.children.push(child);
    try {
      this.machineContext.stateRegistry.set(child.id, child);
    } catch {
      console.warn(
        `State with id ${child.id} already exists. Ignoring duplicate state.`,
      );
    }
  }

  setListener<T extends E['type']>(
    eventType: T,
    handler: EventHandler<Extract<E, { type: T }>, S>,
  ) {
    this.listeners[eventType] = handler;
  }

  notifyListeners(event: MachineEvent, trickleDown: boolean = true) {
    if (this.active) {
      const eventType = event.type as E['type'];
      const listener = this.listeners[eventType];

      if (listener) {
        const targetId = listener(event as Extract<E, MachineEvent>);

        if (targetId) {
          this.transitionTo(targetId);
        }
      }
    }

    if (trickleDown) {
      this.notifyChildren(event);
    }
  }

  transitionTo(targetId: S) {
    const targetState = this.getStateById(targetId);

    if (targetState) {
      this.exit();
      targetState.enter();
    }

    this.machineContext.notifyListeners();
  }

  notifyChildren(event: MachineEvent) {
    for (const child of this.getActiveChildren()) {
      child.notifyListeners(event);
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

  after<S>(ms: number, callback: AfterCallback<S>) {
    const timer = setTimeout(() => {
      const stateId = callback();
      this.transitionTo(stateId);
    }, ms);

    this.timers.push(timer);
  }

  getActiveChildren() {
    return this.children.filter((child) => child.active);
  }

  getChildById(id: S) {
    return this.children.find((child) => child.id === id);
  }

  getSiblingById(id: S) {
    return this.parentState?.getChildById(id);
  }

  getStateById(id: S) {
    const state =
      this.getChildById(id) ??
      this.getSiblingById(id) ??
      this.machineContext.stateRegistry.get(id);

    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }

    return state;
  }
}

export type SerialisedState<X extends StateHierarchy> = X;
