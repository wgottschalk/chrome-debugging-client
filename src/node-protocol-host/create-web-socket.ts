import createDebug = require("debug");
import * as WebSocket from "ws";
import { Connect } from "../../types/connect";

const debug = createDebug("chrome-debugging-client");
const socketDebug = createDebug("chrome-debugging-client:ws");

export default function createWebSocket(url: string): Connect {
  return async receive => {
    socketDebug("opening", url);
    const ws = new WebSocket(url);

    const disconnected = new Promise<void>((resolve, reject) => {
      ws.once("error", reject);
      ws.once("close", resolve);
    });

    ws.on("message", (message: string) => {
      socketDebug("receive", message);
      receive(message)
    });

    ws.on("error", (err) => {
      socketDebug("error", err);
    });

    ws.on("close", (evt) => {
      socketDebug("closed", evt);
    });

    await Promise.race([
      new Promise(resolve => ws.once("open", resolve)),
      disconnected.then(() => {
        throw new Error("disconnected before open");
      }),
    ]);

    socketDebug("opened", url);

    const send = (message: string) => {
      socketDebug("send", message);
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

    return {
      async disconnect() {
        if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          return;
        }
        socketDebug("closing", url);
        ws.close();
      },
      disconnected,
      async dispose() {
        try {
          await this.disconnect();
          await this.disconnected;
        } catch (e) {
          debug(`error closing websocket ${e}`);
        }
      },
      send,
    };
  };
}
