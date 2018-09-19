import * as execa from "execa";

export default async function spawn<T>(
  executablePath: string,
  args: string[],
  stdio: "ignore" | "inherit",
  using: (hasExited: () => boolean) => Promise<T>,
  gracefulExit?: () => Promise<void>,
) {
  const childProcess = execa(executablePath, args, {
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
      childProcess.then(() => {
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
    await exitChrome(childProcess, gracefulExit);
  }
}

async function exitChrome(
  childProcess: execa.ExecaChildProcess,
  gracefulExit?: () => Promise<void>,
) {
  if (gracefulExit) {
    // allow sending Browser.close to websocket
    await gracefulExit();
  } else {
    childProcess.kill();
  }

  // wait for lifetime promise
  // TODO race timeout and force kill
  await childProcess;
}
