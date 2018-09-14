import Disposable from "./disposable";

export interface Host {
  launchChrome(
    options?: ChromeLaunchOptions,
  ): Promise<ChromeProcess & Disposable>;
  createWebSocket(url: string): ConnectionOpener;
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

export interface ConnectionOpener {
  open(delegate: ConnectionDelegate): Promise<Connection & Disposable>;
}

export interface ConnectionDelegate {
  onMessage(message: string): void;
  onDisconnect(err?: Error): void;
}

export interface Connection {
  send(message: string): Promise<void>;
}

export interface HttpClient {
  get(path: string): Promise<string>;
}

export interface ChromeProcess {
  remoteDebuggingPort: number;
  remoteDebuggingPath: string | undefined;
  webSocketDebuggerUrl: string | undefined;
  dataDir: string;
  /** throws if process has exited or there has been an error */
  validate(): void;
}
