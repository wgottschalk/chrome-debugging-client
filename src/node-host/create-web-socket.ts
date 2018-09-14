import * as WebSocket from "ws";
import Disposable from "../../types/disposable";
import {
  Connection,
  ConnectionDelegate,
  ConnectionOpener,
} from "../../types/host";
import { eventPromise } from "../shared/event-promise";

export default function createWebSocket(url: string): ConnectionOpener {
  async function open(
    delegate: ConnectionDelegate,
  ): Promise<Connection & Disposable> {
    const ws = new WebSocket(url);
    await eventPromise(ws, "open", "error");
    return new WebSocketConnection(ws, delegate);
  }
  return { open };
}

class WebSocketConnection implements Connection, Disposable {
  private lastError: Error | undefined = undefined;

  constructor(private ws: WebSocket, private delegate: ConnectionDelegate) {
    ws.on("message", this.onMessage.bind(this));
    ws.on("error", this.onError.bind(this));
    ws.on("close", this.onClose.bind(this));
  }

  public async send(message: string): Promise<void> {
    await send(this.ws, message);
  }

  public async close(): Promise<any> {
    if (this.ws.readyState === WebSocket.CLOSED) {
      return;
    }
    this.ws.removeAllListeners();
    const closePromise = eventPromise(this.ws, "close", "error");
    this.ws.close();
    await closePromise;
  }

  public async dispose(): Promise<any> {
    try {
      await this.close();
    } catch (err) {
      // ignore err since dispose is called in a finally
      // tslint:disable-next-line:no-console
      console.error(err);
    }
  }

  private onMessage(msg: string) {
    this.delegate.onMessage(msg);
  }

  private onError(err: Error) {
    this.lastError = err;
  }

  private onClose() {
    this.ws.removeAllListeners();
    this.delegate.onDisconnect(this.lastError);
  }
}

function send(ws: WebSocket, data: string): Promise<void> {
  return new Promise((resolve, reject) =>
    ws.send(data, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }),
  );
}
