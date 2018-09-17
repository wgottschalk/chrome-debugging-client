import {
  ChromeLaunchOptions,
  ChromeProcess,
  ChromeSpawnOptions,
  UsingCallback,
} from "../../types/host";
import createTmpDir from "./launch-chrome/create-tmpdir";
import { DEFAULT_FLAGS } from "./launch-chrome/flags";
import resolveBrowser from "./launch-chrome/resolve";
import spawnBrowser from "./launch-chrome/spawn";
import waitForPortFile from "./launch-chrome/wait-for-portfile";

export default async function launchChrome<T>(
  options: ChromeLaunchOptions,
  using: UsingCallback<ChromeProcess, T>,
): Promise<T>;
export default async function launchChrome<T>(
  using: UsingCallback<ChromeProcess, T>,
): Promise<T>;
export default async function launchChrome<T>(
  maybeOptionsOrUsing: ChromeLaunchOptions | UsingCallback<ChromeProcess, T>,
  maybeUsing?: UsingCallback<ChromeProcess, T>,
): Promise<T> {
  let using: UsingCallback<ChromeProcess, T>;
  let options: ChromeLaunchOptions | undefined;
  if (maybeUsing !== undefined) {
    using = maybeUsing;
  }
  if (typeof maybeOptionsOrUsing === "function") {
    using = maybeOptionsOrUsing;
  } else {
    options = maybeOptionsOrUsing;
  }
  const executablePath = resolveBrowser(options);
  const userDataRoot = options && options.userDataRoot;
  return await createTmpDir<T>(userDataRoot, userDataDir =>
    doLaunch<T>(executablePath, userDataDir, options, using),
  );
}

async function doLaunch<T>(
  executablePath: string,
  userDataDir: string,
  options: ChromeLaunchOptions | undefined,
  using: UsingCallback<ChromeProcess, T>,
): Promise<T> {
  const args = await getArguments(userDataDir, options);
  const stdio = defaultOption(options, "stdio", "inherit");
  return await spawnBrowser<T>(executablePath, args, stdio, async hasExited => {
    const chrome = await waitForPortFile(userDataDir, hasExited);
    return await using(chrome);
  });
}

function getArguments(
  userDataDir: string,
  options?: ChromeSpawnOptions,
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
