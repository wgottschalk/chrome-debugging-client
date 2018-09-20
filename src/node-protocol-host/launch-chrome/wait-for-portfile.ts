import { readFileSync } from "fs";
import { join } from "path";

const PORT_FILENAME = "DevToolsActivePort";
const NEWLINE = /\r?\n/;

export default async function waitForPortFile(
  userDataDir: string,
  cancelled: Promise<never>,
): Promise<[number, string]> {
  const portFile = join(userDataDir, PORT_FILENAME);

  const deadline = Date.now() + 60 * 1000;
  while (true) {
    await Promise.race([delay(50), cancelled]);

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

export function delay(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
