import { Connect } from "../../types/connect";
import DebuggingProtocolClient from "../../types/debugging-protocol-client";
import { EventEmitter } from "../../types/protocol-host";
import createDebuggingProtocolConnection from "./create-debugging-protocol-connection";

export async function createDebuggingProtocolClient(
  eventEmitter: EventEmitter,
  connect: Connect,
): Promise<DebuggingProtocolClient> {
  const emitEvent = (event: string, params?: any) => {
    eventEmitter.emit(event, params);
  };

  const connection = await createDebuggingProtocolConnection(
    emitEvent,
    connect,
  );

  const until = (event: string) =>
    Promise.race<any>([
      new Promise(resolve => eventEmitter.once(event, resolve)),
      connection.disconnected.then(() => {
        throw new Error(`disconnected before ${event} event occurred`);
      }),
    ]);

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
    on,
    once,
    removeAllListeners,
    removeListener,
    send: connection.send,
    until,
  };
}
