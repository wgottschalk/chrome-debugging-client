import { Chrome } from "../types/protocol-host";
import { DEFAULT_FLAGS } from "./default-chrome-flags";
import defaultHost from "./default-host";

export type ChromeLaunchOptions = {
  chromePath?: string;
  windowSize?: {
    width: number;
    height: number;
  };
  disableDefaultArguments?: boolean;
  additionalArguments?: string[];
  userDataRoot?: string;
  stdio?: "ignore" | "inherit";
};

export default async function spawnChrome(
  options?: ChromeLaunchOptions,
  _spawnChrome = defaultHost().spawnChrome,
  findChrome = defaultHost().findChrome,
  createTmpDir = defaultHost().createTmpDir,
): Promise<Chrome> {
  const chromePath = (options && options.chromePath) || findChrome();
  const tmpDir = createTmpDir(options && options.userDataRoot);
  try {
    const args = getArguments(tmpDir.dir, options);
    const stdio = defaultOption(options, "stdio", "inherit");
    const { dispose, kill, path, port, exited } = await _spawnChrome(
      chromePath,
      tmpDir.dir,
      args,
      stdio,
    );
    return {
      async dispose() {
        await dispose();
        await tmpDir.dispose();
      },
      exited: exited.then(tmpDir.dispose, tmpDir.dispose),
      kill,
      path,
      port,
    };
  } catch (e) {
    tmpDir.dispose();
    throw e;
  }
}

function getArguments(
  userDataDir: string,
  options?: ChromeLaunchOptions,
): string[] {
  const windowSize = defaultOption(options, "windowSize", {
    height: 736,
    width: 414,
  });
  const disableDefaultArguments = defaultOption(
    options,
    "disableDefaultArguments",
    false,
  );
  const defaultArguments = disableDefaultArguments
    ? ([] as string[])
    : DEFAULT_FLAGS;
  const additionalArguments: string[] = defaultOption(
    options,
    "additionalArguments",
    [] as string[],
  );
  return [
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    `--window-size=${windowSize.width},${windowSize.height}`,
  ].concat(defaultArguments, additionalArguments, ["about:blank"]);
}

function defaultOption<K extends keyof ChromeLaunchOptions>(
  options: ChromeLaunchOptions | undefined,
  option: K,
  defaultValue: Required<ChromeLaunchOptions>[K],
): Required<ChromeLaunchOptions>[K] {
  const value = options === undefined ? undefined : options[option];
  if (value === undefined) {
    return defaultValue;
  }
  return value as Required<ChromeLaunchOptions>[K];
}
