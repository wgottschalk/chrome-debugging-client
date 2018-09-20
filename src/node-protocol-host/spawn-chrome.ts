import * as execa from "execa";
import { Chrome } from "../../types/protocol-host";
import waitForPortFile from "./wait-for-portfile";

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

  const exit = () => {
    child.kill();
  };

  const cancelled = exited.then(() => {
    throw Error("early exit of chrome");
  });

  const [port, path] = await Promise.race([
    waitForPortFile(userDataDir, cancelled),
    cancelled,
  ]);

  return {
    exit,
    exited,
    path,
    port,
  };
}
