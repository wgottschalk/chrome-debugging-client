import { ChromeLaunchOptions } from "../../types/protocol-host";
import createTmpDir from "./launch-chrome/create-tmpdir";
import findChrome from "./launch-chrome/find-chrome";
import spawnChrome from "./launch-chrome/spawn-chrome";

export type Chrome = {
  path: string;
  port: number;
  exited: Promise<void>;
  exit: () => void;
};

export default async function launchChrome(
  options: ChromeLaunchOptions,
): Promise<Chrome> {
  const chromePath = findChrome();
  const tmpDir = createTmpDir(options && options.userDataRoot);
  try {
    const { exit, path, port, exited } = await spawnChrome(
      chromePath,
      tmpDir.name,
      options,
    );
    return {
      exit,
      exited: (async () => {
        try {
          await exited;
        } finally {
          tmpDir.removeCallback();
        }
      })(),
      path,
      port,
    };
  } catch (e) {
    tmpDir.removeCallback();
    throw e;
  }
}
