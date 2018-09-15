import Disposable from "./disposable";
import Connection, { ConnectionDelegate } from "./connection";

export type UsingCallback<T, U> = (using: T) => PromiseLike<U> | U;

export interface Host {
  launchChrome<T>(using: UsingCallback<ChromeProcess, T>): Promise<T>;
  launchChrome<T>(
    options: ChromeLaunchOptions,
    using: UsingCallback<ChromeProcess, T>,
  ): Promise<T>;

  openWebSocket<T>(
    url: string,
    delegate: ConnectionDelegate,
    using: UsingCallback<Connection, T>,
  ): Promise<T>;

  createHttpClient(host: string, port: number): HttpClient;

  createEventEmitter(): EventEmitter;
}

export type ChromeSpawnOptions = {
  windowSize?: {
    width: number;
    height: number;
  };
  disableDefaultArguments?: boolean;
  additionalArguments?: string[];
  userDataRoot?: string;
  stdio?: "pipe" | "ignore" | "inherit" | null;
};

export type ChromeResolveOptions = {
  browserType?: "system" | "canary" | "exact";
  executablePath?: string;
};

export type ChromeLaunchOptions = ChromeResolveOptions & ChromeSpawnOptions;

export interface EventEmitter {
  on(event: string, listener: (params?: any) => void): void;
  once(event: string, listener: (params?: any) => void): void;
  removeListener(event: string, listener: (params?: any) => void): void;
  removeAllListeners(event?: string): void;
  emit(event: string, params?: any): void;
}

export interface HttpClient {
  get(path: string): Promise<string>;
}

export interface ChromeProcess {
  remoteDebuggingPort: number;
  remoteDebuggingPath: string | undefined;
  webSocketDebuggerUrl: string | undefined;
}
