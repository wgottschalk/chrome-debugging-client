import { readFileSync } from "fs";
import { join } from "path";
import usingTimeout from "./using-timeout";

const TIMEOUT = 60 * 1000;
const INTERVAL = 50;
const PORT_FILENAME = "DevToolsActivePort";
const NEWLINE = /\r?\n/;

export default async function waitForPortFile(
  userDataDir: string,
  cancelled: Promise<never>,
): Promise<[number, string]> {
  const portFile = join(userDataDir, PORT_FILENAME);

  const deadline = Date.now() + TIMEOUT;
  while (true) {
    await usingTimeout(INTERVAL, timeout => {
      return Promise.race([timeout, cancelled]);
    });

    const text = tryRead(portFile);

    if (text !== undefined) {
      const [portStr, path] = text.split(NEWLINE, 2);
      const port = parseInt(portStr, 10);
      if (port > 0) {
        return [port, path];
      }
    }

    if (Date.now() > deadline) {
      throw new Error(`timeout waiting for ${portFile}`);
    }
  }
}

function tryRead(filename: string): string | undefined {
  try {
    return readFileSync(filename, "utf8");
  } catch (e) {
    // ignore
  }
}
