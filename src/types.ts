import Protocol from "devtools-protocol";
import { ChromeLaunchOptions } from "../types/host";
import IHttpProtocolClient from "../types/http-protocol-client";
import IDebuggingProtocolClient from "../types/protocol-client";

/**
 * The session is a factory for the various debugging client primitives
 * that tracks all of the disposables it creates, so it can ensure they are
 * all cleaned up when it is disposed.
 *
 * It has no other state.
 */
export interface IDebuggingApi {
  launchChrome<T>(
    using: (chrome: ITargetManager) => PromiseLike<T> | T,
  ): Promise<T>;
  launchChrome<T>(
    options: ChromeLaunchOptions,
    using: (chrome: ITargetManager) => PromiseLike<T> | T,
  ): Promise<T>;

  openHttp(host: string, port: number): IHttpProtocolClient;

  /**
   * Open a Chrome Remmote Debugging Protocol client for the specified web socket url.
   * @param webSocketUrl {string} a web socket url.
   */
  openWebSocket<T>(
    url: string,
    using: (chrome: IDebuggingProtocolClient) => PromiseLike<T> | T,
  ): Promise<T>;
}

export interface ITargetManager {
  targets(): IterableIterator<ITarget>;

  createTarget(
    url: string,
    options?: { width?: number; height?: number },
  ): Promise<ITarget>;

  on(
    event: "targetCreated" | "targetDestroyed" | "targetCrashed",
    listener: (target: ITarget) => void,
  ): void;
  on(event: "disconnected", listener: () => void): void;
}

export interface IBrowserTargetManager extends ITargetManager {
  browserContexts: Map<string, IBrowserContext>;
  createBrowserContext(): Promise<IBrowserContext>;
}

export interface ITarget {
  id: string;

  browserContextId: string | undefined;

  info: Protocol.Target.TargetInfo;

  activate(): Promise<void>;
  attach(): IDebuggingProtocolClient;
  close(): Promise<void>;
}

export interface IBrowserContext extends ITargetManager {
  id: string;
  dispose(): Promise<void>;
}

export interface IDisposable {
  /** called in finally should not reject or will mask original error */
  dispose(): Promise<any>;
}

export interface GenericProtocolClient {
  send(command: string, params?: any): Promise<any>;
  until(event: string): Promise<any>;
  on(event: string, listener: (params?: any) => void): void;
  once(event: string, listener: (params?: any) => void): void;
  removeListener(event: string, listener: (params?: any) => void): void;
  removeAllListeners(event?: string): void;
}
