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
  exec(command: string, args: string[]): Promise<Process>;
  // resolvePath(...pathSegments: string[]): string;
  // isFile(path: string): Promise<boolean>;
  // isDirectory(path: string): Promise<boolean>;
  // readFile(path: string): Promise<string>;
  // removeFile(path: string): Promise<void>;
  // removeDirectory(path: string): Promise<void>;
  createTmpDir(): Promise<TemporaryDirectory>;
}

export interface DebugFunction {
  (msg: string): void;
}

export interface TemporaryDirectory extends Disposable {
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
