import Disposable from "../../types/disposable";
import { ChromeLaunchOptions, ChromeProcess } from "../../types/host";
import createTmpDir from "./launch-chrome/create-tmpdir";
import resolveBrowser from "./launch-chrome/resolve";
import spawnBrowser from "./launch-chrome/spawn";

export default async function launchChrome(
  options?: ChromeLaunchOptions,
): Promise<ChromeProcess & Disposable> {
  const executablePath = resolveBrowser(options);
  const tmpDir = await createTmpDir(options && options.userDataRoot);

  this.disposables.add(tmpDir);

  const browserProcess = await spawnBrowser(
    executablePath,
    tmpDir.path,
    options,
  );

  this.disposables.add(browserProcess);

  return browserProcess;
}
