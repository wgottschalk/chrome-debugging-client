import {
  Disposable
} from "./common/disposable";

export interface Host {
  debug(name: string): DebugFunction;
  platform: "darwin" | "win32" | "linux";
  getEnvironmentVariable(variable: string): string;
  createHttpClient(host: string, port: number): HttpClient;
  openWebSocket(url: string): Promise<WebSocketConnection>;
  isExecutable(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  execute(command: string, args: string[]): Promise<Process>;
  createTmpDir(): Promise<TmpDir>;
}

export interface DebugFunction {
  (msg: string): void;
}

export interface TmpDir extends Disposable {
  path: string;
}

export interface Process extends Disposable {
  pid: number;
}

export interface HttpClient {
  get(path: string): Promise<string>;
}

export interface WebSocketDelegate {
  onMessage(data: string): void;
  onError(err: Error): void;
  onClose(): void;
}

export interface WebSocketConnection extends Disposable {
  setDelegate(delegate: WebSocketDelegate): void;
  send(data: string): void;
  close(): void;
}
