import { Connection, ConnectionDelegate } from "../../types/connection";
import Disposable from "../../types/disposable";
import { EventEmitter } from "../../types/host";
import Message from "../../types/message";
import ProtocolClient from "../../types/protocol-client";

type ResponseCallback = {
  (error: Error): void;
  (error: undefined, response: Message.Response): void;
};

export default async function createDebuggingProtocolClient(
  eventEmitter: EventEmitter,
  open: (delegate: ConnectionDelegate) => Promise<Connection & Disposable>,
): Promise<ProtocolClient> {
  let sequence = 0;

  const pending = new Map<number, ResponseCallback>();

  const connection = await open({
    onDisconnect,
    onMessage,
  });

  return {
    on,
    once,
    removeAllListeners,
    removeListener,
    send,
    until,
  };

  async function send(method: string, params?: any): Promise<any> {
    const id = sequence++;

    const data = JSON.stringify({ id, method, params });

    const responsePromise = new Promise<Message.Response>((resolve, reject) => {
      pending.set(id, (err: Error | undefined, message?: Message.Response) => {
        pending.delete(id);
        if (err !== undefined) {
          reject(err);
        } else {
          resolve(message);
        }
      });
    });

    const [response] = await Promise.all([
      responsePromise,
      connection.send(data),
    ]);

    if ("error" in response) {
      throw protocolError(response.error);
    } else {
      return response.result;
    }
  }

  function onMessage(data: string) {
    const message: Message = JSON.parse(data);
    if ("id" in message) {
      const callback = pending.get(message.id);
      if (callback) {
        callback(undefined, message);
      }
    } else {
      eventEmitter.emit(message.method, message.params);
    }
  }

  function onDisconnect() {
    if (pending.size > 0) {
      const callbacks = Array.from(pending.values());
      pending.clear();
      const disconnected = new Error("disconnected before command response");
      for (const callback of callbacks) {
        callback(disconnected);
      }
    }
    eventEmitter.removeAllListeners();
  }

  function on(event: string, listener: (params?: any) => void): void {
    eventEmitter.on(event, listener);
  }

  function once(event: string, listener: (params?: any) => void): void {
    eventEmitter.once(event, listener);
  }

  function removeListener(
    event: string,
    listener: (params?: any) => void,
  ): void {
    eventEmitter.removeListener(event, listener);
  }

  function removeAllListeners(event?: string): void {
    eventEmitter.removeAllListeners(event);
  }

  async function until(event: string) {
    return await new Promise<any>(resolve => eventEmitter.once(event, resolve));
  }
}

export type ProtocolError = Error & { code: number; data: any };

function protocolError({
  message,
  code,
  data,
}: Message.ResponseError): ProtocolError {
  const msg = data ? `${message}:${data}` : message;
  const err = new Error(msg);
  return Object.assign(err, { code, data });
}
