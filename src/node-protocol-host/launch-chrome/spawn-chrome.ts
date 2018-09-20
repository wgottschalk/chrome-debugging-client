import * as execa from "execa";
import { Chrome, ChromeLaunchOptions } from "../../../types/protocol-host";
import { DEFAULT_FLAGS } from "./default-flags";
import waitForPortFile from "./wait-for-portfile";

export default async function spawnChrome(
  chromePath: string,
  userDataDir: string,
  options: ChromeLaunchOptions,
): Promise<Chrome> {
  const args = getArguments(userDataDir, options);
  const stdio = defaultOption(options, "stdio", "inherit");
  const child = execa(chromePath, args, {
    // disable buffer, pipe or drain
    buffer: false,
    stdio,
  } as any);

  const exit = () => {
    child.kill();
  };

  const cancelled = child.then(() => {
    throw Error("early exit of chrome");
  });

  const [port, path] = await Promise.race([
    waitForPortFile(userDataDir, cancelled),
    cancelled,
  ]);

  const exited = child.then(() => {
    // void return
  });

  return {
    exit,
    exited,
    path,
    port,
  };
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
