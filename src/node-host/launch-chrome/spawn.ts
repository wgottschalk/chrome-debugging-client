import * as execa from "execa";

export default async function spawn<T>(
  executablePath: string,
  args: string[],
  stdio: "ignore" | "inherit",
  using: (hasExited: () => boolean) => Promise<T>,
  gracefulExit: () => Promise<void>,
) {
  const child = execa(executablePath, args, {
    // disable buffer, pipe or drain
    buffer: false,
    stdio,
  } as any);

  let result: T;
  let cancelled = false;
  try {
    // race lifetime promise against using promise
    // normally we should not exit chrome before
    result = await Promise.race([
      child.then(() => {
        throw new Error("exited early");
      }),
      using(() => cancelled),
    ]);
  } finally {
    cancelled = true;
  }

  try {
    return result;
  } finally {
    // allow sending Browser.close to websocket
    await gracefulExit();

    // TODO race timeout and kill()
    // wait for lifetime promise
    await child;
  }
}
