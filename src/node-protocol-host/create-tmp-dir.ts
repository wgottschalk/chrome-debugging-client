import createDebug = require("debug");
import * as tmp from "tmp";

tmp.setGracefulCleanup();

const debug = createDebug("chrome-debugging-client");

export default function createTmpDir(
  dir?: string,
): {
  dir: string;
  dispose: () => void;
} {
  const options: tmp.Options = {
    unsafeCleanup: true, // rm -f
  };
  if (dir !== undefined) {
    options.dir = dir;
  }
  const tmpDir = tmp.dirSync(options);
  return {
    dir: tmpDir.name,
    dispose: () => {
      try {
        tmpDir.removeCallback();
      } catch (e) {
        debug(`error removing "${tmpDir.name}": ${e}`);
      }
    },
  };
}
