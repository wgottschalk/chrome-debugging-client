import * as tmp from "tmp";

tmp.setGracefulCleanup();

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
    dispose: tmpDir.removeCallback,
  };
}
