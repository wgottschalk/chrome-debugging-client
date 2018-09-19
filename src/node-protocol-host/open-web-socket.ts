import * as WebSocket from "ws";
import { ReceiveMessage, SendMessage } from "../../types/protocol-host";

export default async function openWebSocket<T>(
  url: string,
  receiveMessage: ReceiveMessage,
  using: (sendMessage: SendMessage) => Promise<T>,
): Promise<T> {
  const ws = new WebSocket(url);
  try {
    return await Promise.race([
      errorOrEarlyDisconnect<T>(ws),
      useWebSocket<T>(ws, receiveMessage, using),
    ]);
  } finally {
    await tryClose(ws);
  }
}

async function errorOrEarlyDisconnect<T>(ws: WebSocket): Promise<T> {
  await new Promise((resolve, reject) => {
    ws.once("error", reject);
    ws.once("close", resolve);
  });
  throw new Error("early disconnect");
}

async function useWebSocket<T>(
  ws: WebSocket,
  receiveMessage: ReceiveMessage,
  using: (sendMessage: SendMessage) => Promise<T>,
): Promise<T> {
  ws.on("message", (data: string) => {
    receiveMessage(data);
  });

  await new Promise(resolve => ws.once("open", resolve));

  return await using(sendMessage);

  async function sendMessage(data: string) {
    return await new Promise<void>((resolve, reject) =>
      ws.send(data, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }),
    );
  }
}

async function tryClose(ws: WebSocket): Promise<void> {
  try {
    if (ws.readyState !== WebSocket.CLOSED) {
      await new Promise(resolve => {
        ws.once("close", resolve);
        ws.close();
      });
    }
  } catch (e) {
    // TODO debug callback?
    // tslint:disable-next-line:no-console
    console.error(e);
  }
}
