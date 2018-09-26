import createDebug = require("debug");
import execa = require("execa");
import { Chrome } from "../../types/protocol-host";
import waitForPortFile from "./wait-for-portfile";

const debug = createDebug("chrome-debugging-client");

export default async function spawnChrome(
  chromePath: string,
  userDataDir: string,
  args: string[],
  stdio: "ignore" | "inherit",
): Promise<Chrome> {
  const child = execa(chromePath, args, {
    // disable buffer, pipe or drain
    buffer: false,
    stdio,
  } as any);

  // even though the child promise is a promise of exit
  // it has weird expectations that both signal and exitcode
  // are present which doesn't seem to be always the case

  child.catch(() => {
    // ignore for unhandled rejection
  });

  const exited = new Promise<void>((resolve, reject) => {
    let lastError: Error | undefined;
    child.on("error", err => {
      lastError = err;
    });
    child.once("close", () => {
      if (lastError) {
        reject(lastError);
      } else {
        resolve();
      }
    });
  });

  const cancelled = exited.then(() => {
    throw Error("unexpected exit while waiting for DevToolsActivePort file");
  });

  const [port, path] = await Promise.race([
    waitForPortFile(userDataDir, cancelled),
    cancelled,
  ]);

  const kill = () => child.kill();
  const dispose = async () => {
    try {
      kill();
      await exited;
    } catch (e) {
      debug(`error killing chrome: ${e}`);
    }
  };

  return {
    dispose,
    exited,
    kill,
    path,
    port,
  };
}
