import Connect from "./connect";

export interface ProtocolHost {
  createTmpDir: CreateTmpDir;
  findChrome: FindChrome;
  spawnChrome: SpawnChrome;
  createWebSocket(url: string): Connect;
  createHttpGet(host: string, port: number): HttpGet;
  createEventEmitter(): EventEmitter;
}

export type FindChrome = () => string;

export type CreateTmpDir = (dir?: string) => TmpDir;

export interface TmpDir {
  dir: string;
  dispose(): void;
}

export type SpawnChrome = (
  chromePath: string,
  userDataDir: string,
  args: string[],
  stdio: "ignore" | "inherit",
) => Promise<Chrome>;

export type Chrome = {
  /**
   * The remote debugging port.
   */
  port: number;

  /**
   * The web socket url path.
   */
  path: string;

  /**
   * A promise for the exit of the Chrome process.
   * Useful for making cancellation promises.
   *
   * `Promise.race([doSomething(), exited.then(() => { throw Error(); })]);`
   */
  exited: Promise<void>;

  /**
   * Signals the Chrome process to quit.
   *
   * You can await the exited promise to wait for Chrome to exit.
   */
  exit: () => void;
};

export interface EventEmitter {
  on(event: string, listener: (params?: any) => void): void;
  once(event: string, listener: (params?: any) => void): void;
  removeListener(event: string, listener: (params?: any) => void): void;
  removeAllListeners(event?: string): void;
  emit(event: string, params?: any): void;
}

export type HttpGet = (path: string) => Promise<string>;
