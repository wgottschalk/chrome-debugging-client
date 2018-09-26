import Protocol from "devtools-protocol";
import {
  Connect,
  Connection,
  ReceiveMessage,
  SendMessage,
} from "../../types/connect";
import ProtocolClient from "../../types/protocol-client";

export type TargetID = Protocol.Target.TargetID;
export type SessionID = Protocol.Target.SessionID;
export type BrowserContextID = Protocol.Target.BrowserContextID;
export type TargetInfo = Protocol.Target.TargetInfo;

export interface Target {
  id: TargetID;
  info: TargetInfo;
  client: ProtocolClient | undefined;

  attach(): Promise<ProtocolClient>;

  ativate(): Promise<void>;

  close(): Promise<void>;
}

export interface BrowserContext {
  id: BrowserContextID;

  targets(): IterableIterator<Target>;
  destroy(): Promise<void>;
}

export interface TargetManager {
  browserContexts(): IterableIterator<BrowserContext>;
  targets(): IterableIterator<Target>;
  createBrowserContext(): Promise<BrowserContext>;
  createTarget(): Promise<Target>;
}

export interface TargetManagerDelegate {
  sendMessage: SendMessage;
}

export default function createTargetConnections(
  createTarget: (
    target: Protocol.Target.CreateTargetRequest,
  ) => Promise<Protocol.Target.CreateTargetResponse>,
  sendMessage: (sessionId: SessionID, message: string) => Promise<void>,
  connect: (
    receiveMessage: (sessionId: SessionID, message: string) => void,
    targetInfoChanged: (event: Protocol.Target.TargetInfoChangedEvent) => void,
  ) => void,
): TargetManager {
  throw new Error();

  // const sessionMap = new Map<SessionID, {
  //   resolveDisconnect: () => void;
  //   receiveMessage: ReceiveMessage | undefined;
  //   targetId: TargetID;
  //   sessionId: SessionID;
  //   client: Promise<ProtocolClient>;
  // }>();

  // const receiveMap = new Map<string, ReceiveMessage>();
  // const disconnectedMap = new Map<string, () => void>();

  // browser.on("Target.receivedMessageFromTarget", ({ sessionId, message }) => {
  //   const receive = receiveMap.get(sessionId);
  //   if (receive) {
  //     receive(message);
  //   }
  // });

  // browser.on("Target.detachedFromTarget", ({ sessionId }) => {
  //   const resolve = disconnectedMap.get(sessionId);
  //   if (resolve !== undefined) {
  //     resolve();
  //     disconnectedMap.delete(sessionId);
  //     receiveMap.delete(sessionId);
  //   }
  // });

  // // browser.on("Target.targetCreated", (evt) => {

  // // });

  // // browser.on("Target.targetCrashed", (evt) => {
  // //   evt.targetId
  // //   evt.
  // // });

  // browser.on("Target.attachedToTarget", ({ sessionId }) => {
  //   let disconnectRequested = false;
  //   const disconnected = new Promise<void>(resolve => disconnectedMap.set(sessionId, resolve));
  //   const disconnect = async () => {
  //     if (!disconnectRequested) {
  //       disconnectRequested = true;
  //       if (disconnectedMap.has(sessionId)) {
  //         browser.send("Target.detachFromTarget", { sessionId });
  //       }
  //     }
  //   };
  //   const send = (message: string) => browser.send("Target.sendMessageToTarget", { sessionId, message });
  //   const connection: Connection<SendMessage> = {
  //     disconnect,
  //     disconnected,
  //     async dispose() {
  //       disconnect();
  //       await disconnected;
  //     },
  //     send,
  //   };

  //   attach(sessionId, (receiveMessage) => {
  //     receiveMap.set(sessionId, receiveMessage);
  //     return Promise.resolve(connection);
  //   });
  // });
}
