import * as tmp from "tmp";

tmp.setGracefulCleanup();

export default async function createTmpDir<T>(
  dir: string | undefined,
  using: (dir: string) => Promise<T>,
): Promise<T> {
  const options: tmp.Options = {
    unsafeCleanup: true, // rm -f
  };
  if (dir !== undefined) {
    options.dir = dir;
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
