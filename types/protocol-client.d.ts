import { ProtocolMapping } from "devtools-protocol/types/protocol-mapping";

export namespace ProtocolClient {
  export type Events = ProtocolMapping.Events;
  export type Commands = ProtocolMapping.Commands;

  export type Command = keyof Commands;
  export type Event = keyof Events;

  export type CommandParamsType<
    C extends Command
  > = Commands[C]["paramsType"][0];
  export type CommandReturnType<C extends Command> = Commands[C]["returnType"];
  export type EventParamsType<E extends Event> = Events[E][0];

  export type CommandWithoutParams = {
    [C in Command]: CommandParamsType<C> extends never ? C : never
  }[Command];

  export type CommandWithParams = Exclude<Command, CommandWithoutParams>;

  export type CommandWithOptionalParams = {
    [C in CommandWithParams]: Extract<
      CommandParamsType<C>,
      undefined
    > extends never
      ? never
      : C
  }[CommandWithParams];

  export type CommandWithRequiredParams = Exclude<
    CommandWithParams,
    CommandWithOptionalParams
  >;

  export type EventWithoutParams = {
    [E in Event]: EventParamsType<E> extends never ? E : never
  }[Event];

  export type EventWithParams = Exclude<Event, EventWithoutParams>;

  export type EventListener<E extends Event> = E extends EventWithoutParams
    ? () => void
    : (params: EventParamsType<E>) => void;
}

/**
 * Chrome Remote Debugging Protocol Client
 */
export interface ProtocolClient {
  send<C extends ProtocolClient.CommandWithoutParams>(
    command: C,
  ): Promise<ProtocolClient.CommandReturnType<C>>;
  send<C extends ProtocolClient.CommandWithOptionalParams>(
    command: C,
    params?: ProtocolClient.CommandParamsType<C>,
  ): Promise<ProtocolClient.CommandReturnType<C>>;
  send<C extends ProtocolClient.CommandWithRequiredParams>(
    command: C,
    params: ProtocolClient.CommandParamsType<C>,
  ): Promise<ProtocolClient.CommandReturnType<C>>;

  until<E extends ProtocolClient.EventWithParams>(
    event: E,
  ): Promise<ProtocolClient.EventParamsType<E>>;
  until<E extends ProtocolClient.EventWithoutParams>(event: E): Promise<void>;

  on<E extends ProtocolClient.EventWithoutParams>(
    event: E,
    listener: () => void,
  ): void;
  on<E extends ProtocolClient.EventWithParams>(
    event: E,
    listener: (params: ProtocolClient.EventParamsType<E>) => void,
  ): void;

  once<E extends ProtocolClient.EventWithoutParams>(
    event: E,
    listener: () => void,
  ): void;
  once<E extends ProtocolClient.EventWithParams>(
    event: E,
    listener: (params: ProtocolClient.EventParamsType<E>) => void,
  ): void;

  removeListener<E extends ProtocolClient.EventWithoutParams>(
    event: E,
    listener: () => void,
  ): void;
  removeListener<E extends ProtocolClient.EventWithParams>(
    event: E,
    listener: (params: ProtocolClient.EventParamsType<E>) => void,
  ): void;

  removeAllListeners(event?: ProtocolClient.Event): void;

  disconnected: Promise<void>;

  disconnect(): Promise<void>;

  dispose(): Promise<void>;
}

export default ProtocolClient;
