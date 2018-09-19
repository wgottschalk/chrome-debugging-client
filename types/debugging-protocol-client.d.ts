import { ProtocolMapping } from "devtools-protocol/types/protocol-mapping";

export namespace DebuggingProtocolClient {
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
export interface DebuggingProtocolClient {
  send<C extends DebuggingProtocolClient.CommandWithoutParams>(
    command: C,
  ): Promise<DebuggingProtocolClient.CommandReturnType<C>>;
  send<C extends DebuggingProtocolClient.CommandWithOptionalParams>(
    command: C,
    params?: DebuggingProtocolClient.CommandParamsType<C>,
  ): Promise<DebuggingProtocolClient.CommandReturnType<C>>;
  send<C extends DebuggingProtocolClient.CommandWithRequiredParams>(
    command: C,
    params: DebuggingProtocolClient.CommandParamsType<C>,
  ): Promise<DebuggingProtocolClient.CommandReturnType<C>>;

  until<E extends DebuggingProtocolClient.EventWithParams>(
    event: E,
  ): Promise<DebuggingProtocolClient.EventParamsType<E>>;
  until<E extends DebuggingProtocolClient.EventWithoutParams>(
    event: E,
  ): Promise<void>;

  on<E extends DebuggingProtocolClient.Event>(
    event: E,
    listener: DebuggingProtocolClient.EventListener<E>,
  ): void;

  once<E extends DebuggingProtocolClient.Event>(
    event: E,
    listener: DebuggingProtocolClient.EventListener<E>,
  ): void;

  removeListener<E extends DebuggingProtocolClient.Event>(
    event: E,
    listener: DebuggingProtocolClient.EventListener<E>,
  ): void;

  removeAllListeners(event?: DebuggingProtocolClient.Event): void;

  disconnected: Promise<void>;

  disconnect(): Promise<void>;
}

export default DebuggingProtocolClient;
