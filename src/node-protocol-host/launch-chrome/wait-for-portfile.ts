import { readFileSync } from "fs";
import { join } from "path";

const PORT_FILENAME = "DevToolsActivePort";
const NEWLINE = /\r?\n/;

export default async function waitForPortFile(
  userDataDir: string,
  isCancellationRequested: () => boolean,
): Promise<{
  remoteDebuggingPath: string;
  remoteDebuggingPort: number;
  webSocketDebuggerUrl: string;
}> {
  const portFile = join(userDataDir, PORT_FILENAME);
  const deadline = Date.now() + 60 * 1000;
  while (true) {
    await delay(50);
    const [remoteDebuggingPort, remoteDebuggingPath] = tryReadPort(portFile);
    if (remoteDebuggingPort > 0) {
      const webSocketDebuggerUrl = `ws://127.0.0.1:${remoteDebuggingPort}${remoteDebuggingPath}`;
      return {
        remoteDebuggingPath,
        remoteDebuggingPort,
        webSocketDebuggerUrl,
      };
    }
    if (isCancellationRequested()) {
      throw new Error(`cancelled waiting for ${portFile}`);
    }
    if (Date.now() > deadline) {
      throw new Error(`timeout waiting for ${portFile}`);
    }
  }
}

function tryReadPort(filename: string): [number, string] {
  try {
    const data = readFileSync(filename, "utf8");
    const [portStr, wsPath] = data.split(NEWLINE, 2);
    const port = parseInt(portStr, 10);
    // handles NaN if write was created but port not written
    return port > 0 ? [port, wsPath] : [0, wsPath];
  } catch (e) {
    return [0, ""];
  }
}

export function delay(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
