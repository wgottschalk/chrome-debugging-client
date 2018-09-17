import * as tmp from "tmp";
import Disposable from "../../../types/disposable";

tmp.setGracefulCleanup();

export interface TmpDir extends Disposable {
  path: string;
}

export default async function createTmpDir<T>(
  customRoot: string | undefined,
  using: (dir: string) => Promise<T>,
): Promise<T> {
  const options: tmp.Options = {
    unsafeCleanup: true,
  };
  if (customRoot !== undefined) {
    options.dir = customRoot;
  }
  const tmpDir = tmp.dirSync(options);
  try {
    return await using(tmpDir.name);
  } finally {
    try {
      tmpDir.removeCallback();
    } catch (e) {
      // TODO debug logging callback
      /* tslint:disable:no-console */
      console.error(e);
      /* tslint:enable:no-console */
    }
  }
}
