import { Connect } from "../../types/connect";
import ProtocolClient from "../../types/protocol-client";
import { EventEmitter, UsingTimeout } from "../../types/protocol-host";
import createProtocolConnection, { Event } from "./create-protocol-connection";
import createRaceDisconnected from "./create-race-disconnected";
import createProtocolError from "./create-protocol-error";

const DEFAULT_EVENT_TIMEOUT = 60000;

export default async function createProtocolClient(
  eventEmitter: EventEmitter,
  connect: Connect,
  usingTimeout: UsingTimeout,
): Promise<ProtocolClient> {
  const emitEvent = (event: Event) => {
    eventEmitter.emit(event.method, event.params);
  };

  const connection = await createProtocolConnection(
    emitEvent,
    connect,
    usingTimeout,
  );

  const send = async (
    method: string,
    maybeParamsOrTimeout: object | number | undefined,
    maybeTimeout?: number,
  ) => {
    let params: object | undefined;
    let timeout: number | undefined;
    if (maybeParamsOrTimeout === undefined) {
      params = {};
    } else if (typeof maybeParamsOrTimeout === "number") {
      params = {};
      timeout = maybeParamsOrTimeout;
    } else {
      params = maybeParamsOrTimeout;
    }
    if (maybeTimeout !== undefined) {
      timeout = maybeTimeout;
    }
    const response = await connection.send(
      {
        method,
        params,
      },
      timeout,
    );
    if ("error" in response) {
      throw createProtocolError(
        response.error.message,
        response.error.code,
        response.error.data,
      );
    }
    return response.result;
  };

  const raceDisconnected = createRaceDisconnected(
    connection.disconnected,
    DEFAULT_EVENT_TIMEOUT,
    usingTimeout,
  );

  const until = async (event: string, timeout?: number) => {
    let listener: ((params?: any) => void) | undefined;
    try {
      return await raceDisconnected(
        new Promise<any>(resolve => {
          eventEmitter.on(event, resolve);
          listener = resolve;
        }),
        event,
        timeout,
      );
    } finally {
      if (listener !== undefined) {
        eventEmitter.removeListener(event, listener);
      }
    }
  };

  const on = (event: string, listener: (params?: any) => void) => {
    eventEmitter.on(event, listener);
  };
  const once = (event: string, listener: (params?: any) => void) => {
    eventEmitter.on(event, listener);
  };
  const removeListener = (event: string, listener: (params?: any) => void) => {
    eventEmitter.on(event, listener);
  };

  const removeAllListeners = (event?: string) => {
    eventEmitter.removeAllListeners(event);
  };

  return {
    disconnect: connection.disconnect,
    disconnected: connection.disconnected,
    dispose: connection.dispose,
    on,
    once,
    removeAllListeners,
    removeListener,
    send,
    until,
  };
}
