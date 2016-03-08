import {
  Host,
  DebugFunction,
  HttpClient,
  WebSocketConnection,
  WebSocketDelegate,
  TemporaryDirectory,
  Process
} from "../host";

function normalize(path: string): string {
  return path.replace(/\\/g, "/");
}

export function createNodeHost(): Host {
  const WebSocket: WSModule = require("ws");
  const http: HttpModule = require("http");
  const os: OSModule = require("os");
  const fs: FSModule = require("fs");
  const child_process: ChildProcessModule = require("child_process");
  const tmp: TmpModule = require("tmp");

  tmp.setGracefulCleanup();

  function openWebSocket(url: string): Promise<WebSocketConnection> {
    return new Promise<WebSocketConnection>(resolve => {
      let ws = new WebSocket(url);
      let connection = new NodeWebSocketConnection(ws);
      resolve(eventPromise(ws, "open", "error").then(() => connection));
    });
  }

  function createHttpClient(host: string, port: number): HttpClient {
    function get(path: string) {
      return new Promise<string>(resolve => {
        let request = http.get({ host, port, path });
        resolve(readResponse(request));
      });
    }
    return { get: get };
  }

  function getEnvironmentVariable(variable: string): string {
    return process.env[variable];
  }

  function isExecutable(path: string) {
    return new Promise<boolean>((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        resolve(!err && stats.isFile());
      });
    });
  }

  function createTemporaryDirectory(): Promise<TemporaryDirectory> {
    return new Promise((resolve) => {
      let tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      resolve({
        path: normalize(tmpobj.name),
        dispose() {
          return new Promise(resolve => {
            try {
              tmpobj.removeCallback();
            } catch (e) {}
          });
        }
      });
    });
  }

  function readFile(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(file, {
        encoding: "utf8"
      }, (err, data) => err ? reject(err) : resolve(data));
    });
  }

  function deleteFile(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => fs.unlink(path, err => err ? reject(err) : resolve()));
  }

  function exec(executable: string, args: string[]): Promise<Process> {
    return new Promise((resolve, reject) => {
      let child = child_process.execFile(executable, args, {
        encoding: "utf8"
      });
      if (child.pid) {
        resolve({
          pid: child.pid,
          dispose() {
            child.kill();
            return eventPromise(child, "exit", "error").catch(err => console.error(err)); // TODO use debug
          }
        });
      } else {
        child.on("error", reject);
        child.stderr.removeAllListeners("data");
        child.stderr.pipe(process.stderr);
        child.stdout.removeAllListeners("data");
        child.stdout.pipe(process.stdout);
      }
    });
  }

  return {
    debug: require("debug"),
    platform: platform(os.platform()),
    getEnvironmentVariable: getEnvironmentVariable,
    createHttpClient: createHttpClient,
    openWebSocket: openWebSocket,
    isExecutable: isExecutable,
    createTmpDir: createTemporaryDirectory,
    readFile: readFile,
    deleteFile: deleteFile,
    exec: exec
  };
}

function platform(value: string): "darwin" | "win32" | "linux" {
  return value === "darwin" ? "darwin" : value === "win32" ? "win32" : "linux";
}

declare function require(id: string): any;

declare namespace process {
  export const env: { [key: string]: string; };
  export const stdout: Stream;
  export const stderr: Stream;
}

function readResponse(request: ClientRequest): Promise<string> {
  return eventPromise<IncomingMessage>(request, "response", "error").then(response => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk: string) => {
      body += chunk;
    });
    return eventPromise(response, "end", "error").then(() => {
      let statusCode = response.statusCode;
      if (response.statusCode !== 200) {
        throw new ResponseError(body, statusCode);
      }
      return body;
    });
  });
}

class ResponseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NodeWebSocketConnection {
  private ws: WSModule.WebSocket;
  private delegate: WebSocketDelegate;
  constructor(ws: WSModule.WebSocket) {
    this.ws = ws;
  }

  setDelegate(delegate: WebSocketDelegate) {
    this.delegate = delegate;
    let ws = this.ws;
    ws.on("message", (data: string) => delegate.onMessage(data));
    ws.on("error", (err: Error) => delegate.onError(err));
    ws.on("close", () => delegate.onClose());
  }

  send(data: string) {
    this.ws.send(data);
  }

  close() {
    this.ws.close();
  }

  dispose() {
    return new Promise(resolve => {
      let ws = this.ws;
      if (ws.readyState === ws.CLOSED) {
        resolve();
      } else {
        ws.close();
        resolve(eventPromise(ws, "close", "error"));
      }
    }).catch(err => console.error(err)); // TODO use debug
  }
}

interface EventNotifier {
  on(event: string, listener: Function): any;
  removeListener(event: string, listener: Function): any;
  removeAllListeners(event?: string): any;
}

function eventPromise<T>(emitter: EventNotifier, resolveEvent: string, rejectEvent: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let resolveHandler = (evt: any) => {
      resolve(evt);
      emitter.removeListener(resolveEvent, resolveHandler);
      emitter.removeListener(rejectEvent, rejectHandler);
    };
    let rejectHandler = (evt: any) => {
      reject(evt);
      emitter.removeListener(resolveEvent, resolveHandler);
      emitter.removeListener(rejectEvent, rejectHandler);
    };
    emitter.on(resolveEvent, resolveHandler);
    emitter.on(rejectEvent, rejectHandler);
  });
}

interface TmpModule {
  dirSync(options?: {
    unsafeCleanup?: boolean;
  }): {
    name: string;
    removeCallback(): void;
  };
  setGracefulCleanup(): void;
}

interface OSModule {
  platform(): string;
}

interface HttpGet {
  (options: any): ClientRequest;
}

interface HttpModule {
  get: HttpGet;
}

interface FSModule {
  stat(path: string, callback: (err: Error, stats: Stats) => void): void;
  readFile(file: string, options: { encoding: string }, callback: (err: Error, data: string) => void): void;
  unlink(path: string, callback: (err: Error) => void): void;
}

interface ChildProcessModule {
  execFile(executable: string, args: string[], options: any): ChildProcess;
}

interface Stream extends EventNotifier {
  pipe(stream: Stream): void;
}

interface ChildProcess extends EventNotifier {
  on(event: "close", callback: () => void): void;
  on(event: "exit", callback: (code: number, signal: string) => void): void;
  on(event: "error", callback: (err: Error) => void): void;
  kill(signal?: string): void;
  pid: number;
  stderr: Stream;
  stdout: Stream;
}

interface Stats {
  isFile(): boolean;
}

interface ClientRequest extends EventNotifier {
}

interface IncomingMessage extends EventNotifier {
  statusCode: number;
  setEncoding(encoding: string): void;
}

interface WSModule {
  new (url: string): WSModule.WebSocket;
}

namespace WSModule {
  export interface WebSocket extends EventNotifier {
    readyState: number;
    CLOSED: number;
    close(code?: number, data?: any): void;
    send(data: any, cb?: (err: Error) => void): void;
    readState: number;
  }
}
