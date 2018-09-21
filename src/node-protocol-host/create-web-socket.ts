import * as WebSocket from "ws";
import { Connect } from "../../types/connect";

// tslint:disable-next-line:no-var-requires
const debug: (message: string) => void = require("debug")("chrome-debugging-client");
// tslint:disable-next-line:no-var-requires
const debugSocket: (...args: any[]) => void = require("debug")("chrome-debugging-client:ws");

export default function createWebSocket(url: string): Connect {
  return async receive => {
    debugSocket("opening", url);
    const ws = new WebSocket(url);

    const disconnected = new Promise<void>((resolve, reject) => {
      ws.once("error", reject);
      ws.once("close", resolve);
    });

    ws.on("message", (message: string) => {
      debugSocket("receive", message);
      receive(message)
    });

    ws.on("error", (err) => {
      debugSocket("error", err);
    });

    ws.on("close", (evt) => {
      debugSocket("closed", evt);
    });

    await Promise.race([
      new Promise(resolve => ws.once("open", resolve)),
      disconnected.then(() => {
        throw new Error("disconnected before open");
      }),
    ]);

    debugSocket("opened", url);

    const send = (message: string) => {
      debugSocket("send", message);
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
        debugSocket("closing", url);
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
