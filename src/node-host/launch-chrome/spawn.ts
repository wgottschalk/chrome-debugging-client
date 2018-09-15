import * as execa from "execa";
import * as fs from "fs";
import * as path from "path";
import { ChromeProcess, ChromeSpawnOptions } from "../../../types/host";
import { delay } from "../../shared/delay";
import { DEFAULT_FLAGS } from "./flags";

const PORT_FILENAME = "DevToolsActivePort";
const NEWLINE = /\r?\n/;

export default async function spawn<T>(
  executablePath: string,
  dataDir: string,
  options: ChromeSpawnOptions,
  using: (process: ChromeProcess) => PromiseLike<T> | T,
) {
  const args = getArguments(dataDir, options);
  const stdio = options === undefined ? undefined : options.stdio;

  const portFile = path.join(dataDir, PORT_FILENAME);
  tryDeleteFile(portFile);

  const child = execa(executablePath, args, {
    // disable buffer, pipe or drain
    buffer: false,
    stdio,
  } as any);

  let cancelled = false;

  // race lifetime promise against using promise
  // normally we should not exit chrome before
  const chrome = await Promise.race([
    await waitForChromeExit(),
    await waitForPortFile(),
  ]);

  return await using(chrome);

  async function waitForChromeExit(): Promise<ChromeProcess> {
    await child;
    cancelled = true;
    throw new Error("exited early");
  }

  async function waitForPortFile(): Promise<ChromeProcess> {
    const deadline = Date.now() + 60 * 1000;
    while (true) {
      await delay(50);
      const [remoteDebuggingPort, remoteDebuggingPath] = await tryReadPort(
        portFile,
      );
      if (remoteDebuggingPort > 0) {
        const webSocketDebuggerUrl = `ws://127.0.0.1:${remoteDebuggingPort}${remoteDebuggingPath}`;
        return {
          remoteDebuggingPath,
          remoteDebuggingPort,
          webSocketDebuggerUrl,
        };
      }
      if (cancelled) {
        throw new Error(`cancelled waiting for ${portFile}`);
      }
      if (Date.now() > deadline) {
        throw new Error(`timeout waiting for ${portFile}`);
      }
    }
  }
}

function getArguments(dataDir: string, options?: ChromeSpawnOptions): string[] {
  const windowSize = (options && options.windowSize) || {
    height: 736,
    width: 414,
  };
  const defaultArguments =
    options === undefined || options.disableDefaultArguments !== true
      ? DEFAULT_FLAGS
      : [];
  const additionalArguments = (options && options.additionalArguments) || [];
  return [
    "--remote-debugging-port=0",
    `--user-data-dir=${dataDir}`,
    `--window-size=${windowSize.width},${windowSize.height}`,
  ].concat(defaultArguments, additionalArguments, ["about:blank"]);
}

function tryDeleteFile(filename: string): Promise<void> {
  return new Promise<void>(resolve => fs.unlink(filename, () => resolve()));
}

function tryReadPort(filename: string) {
  return new Promise<[number, string | undefined]>(resolve => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err || data.length === 0) {
        resolve([0, undefined]);
      } else {
        const [portStr, wsPath] = data.split(NEWLINE, 2);
        const port = parseInt(portStr, 10);
        // handles NaN if write was created but port not written
        port > 0 ? resolve([port, wsPath]) : resolve([0, wsPath]);
      }
    });
  });
}
