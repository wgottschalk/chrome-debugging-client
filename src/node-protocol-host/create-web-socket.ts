import * as WebSocket from "ws";
import { Connect } from "../../types/connect";

export default function createWebSocket(url: string): Connect {
  return async receive => {
    const ws = new WebSocket(url);

    const disconnected = new Promise<void>((resolve, reject) => {
      ws.once("error", reject);
      ws.once("close", resolve);
    });

    ws.on("message", (message: string) => receive(message));

    await Promise.race([
      new Promise(resolve => ws.once("open", resolve)),
      disconnected.then(() => {
        throw new Error("disconnected before open");
      }),
    ]);

    const send = (message: string) => {
      return new Promise<void>((resolve, reject) =>
        ws.send(message, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }),
      );
    };

    const disconnect = async () => {
      ws.close();
    };

    return {
      disconnect,
      disconnected,
      send,
    };
  };
}
