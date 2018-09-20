import * as tmp from "tmp";

tmp.setGracefulCleanup();

export default function createTmpDir(dir: string | undefined) {
  const options: tmp.Options = {
    unsafeCleanup: true, // rm -f
  };
  if (dir !== undefined) {
    options.dir = dir;
  }
  return tmp.dirSync(options);
}
