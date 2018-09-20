import Connect from "./connect";

export interface ProtocolHost {
  launchChrome(options: ChromeLaunchOptions): Promise<Chrome>;

  openWebSocket(url: string): Connect;

  createHttpClient(host: string, port: number): HttpClient;

  createEventEmitter(): EventEmitter;
}

export type ChromeLaunchOptions = {
  chromePath?: string;
  windowSize?: {
    width: number;
    height: number;
  };
  disableDefaultArguments?: boolean;
  additionalArguments?: string[];
  userDataRoot?: string;
  stdio?: "ignore" | "inherit";
};

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

export type Chrome = {
  path: string;
  port: number;
  exited: Promise<void>;
  exit: () => void;
};
