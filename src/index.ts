import DebuggingProtocolClient from "../types/debugging-protocol-client";
import {
  ChromeLaunchOptions,
  ChromeProcess,
  Host,
} from "../types/protocol-host";
import _createHttpProtocolClient from "./protocol/create-http-protocol-client";

declare const require: (mod: string) => any;

const defaultHost = (() => {
  let host: Host | undefined;
  return () => {
    if (host === undefined) {
      host = require("./node-protocol-host") as Host;
    }
    return host;
  };
})();

export function createHttpProtocolClient(
  hostname: string,
  port: number,
  host: Host = defaultHost(),
) {
  return _createHttpProtocolClient(host.createHttpClient(hostname, port));
}

export function createDebuggingProtocolClient<T>(
  _webSocketUrl: string,
  _using: (using: DebuggingProtocolClient) => Promise<T>,
  _host: Host = defaultHost(),
) {
  // _createDebuggingProtocolClient(host.createEventEmitter(), delegate => {});
  // host.openWebSocket(webSocketUrl, dele);
  throw new Error("not implemented");
}

export default async function launchChrome<T>(
  options: ChromeLaunchOptions,
  using: (using: ChromeProcess) => Promise<T>,
  host?: Host,
): Promise<T>;
export default async function launchChrome<T>(
  using: (using: ChromeProcess) => Promise<T>,
  host?: Host,
): Promise<T>;
export default async function launchChrome<T>(
  _maybeOptionsOrUsing:
    | ChromeLaunchOptions
    | ((using: ChromeProcess) => Promise<T>),
  _maybeUsingOrHost?: ((using: ChromeProcess) => Promise<T>) | Host,
  _maybeHost?: Host,
): Promise<T> {
  let options: ChromeLaunchOptions | undefined;
  let host: Host | undefined;
  let using: ((using: ChromeProcess) => Promise<T>) | undefined;
  if (_maybeHost !== undefined) {
    host = _maybeHost;
  }
  if (_maybeUsingOrHost !== undefined) {
    if (typeof _maybeUsingOrHost === "function") {
      using = _maybeUsingOrHost;
    } else {
      host = _maybeUsingOrHost;
    }
  }
  if (typeof _maybeOptionsOrUsing === "function") {
    using = _maybeOptionsOrUsing;
  } else {
    options = _maybeOptionsOrUsing;
  }
  if (options === undefined) {
    options = {};
  }
  if (host === undefined) {
    host = defaultHost();
  }
  if (using === undefined) {
    throw new Error("using callback required");
  }
  return await host.launchChrome(options, using);
}
