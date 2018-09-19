import { ReceiveMessage, SendMessage } from "./connect";

export interface Host {
  launchChrome<T>(
    options: ChromeLaunchOptions,
    using: (using: ChromeProcess) => Promise<T>,
  ): Promise<T>;

  openWebSocket<T>(
    url: string,
    receiveMessage: ReceiveMessage,
    using: (sendMessage: SendMessage) => Promise<T>,
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
  stdio?: "ignore" | "inherit";
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
