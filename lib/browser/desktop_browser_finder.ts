import { Host } from "../host";
import {
  BrowserFinderOptions,
  BrowserFinder,
  BrowserLauncher
} from "../browser";
import { DesktopBrowserLauncher } from "./desktop_browser_launcher";

const MAC_CONTENT_SHELL_NAME = "Content Shell.app/Contents/MacOS/Content Shell";
const WINDOWS_CONTENT_SHELL_NAME = "content_shell.exe";
const LINUX_CONTENT_SHELL_NAME = "content_shell";

export class DesktopBrowserFinder implements BrowserFinder {
  constructor(private host: Host) {
  }

  availableLaunchers(options: BrowserFinderOptions): Promise<BrowserLauncher[]> {
    return Promise.all([
      this.findExact(options.browserExecutable),
      this.findRelease(),
      this.findCanary()
    ]).then(launchers => launchers.filter(launcher => !!launcher));
  }

  availableTypes(options: BrowserFinderOptions): Promise<string[]> {
    return this.availableLaunchers(options).then(
      launchers => launchers.map(launcher => launcher.browserType)
    );
  }

  findLauncher(options: BrowserFinderOptions): Promise<BrowserLauncher | undefined> {
    switch (options.browserType) {
      case "exact":
        return this.findExact(options.browserExecutable);
      case "release":
        return this.findRelease();
      case "canary":
        return this.findCanary();
      case "any":
        return this.findFirstAvailable(options);
      default:
        // fall through to next finder
        return Promise.resolve(undefined);
    }
  }

  findFirstAvailable(options: BrowserFinderOptions): Promise<BrowserLauncher> {
    return this.findExact(options.browserExecutable).then(launcher => {
      if (launcher) return launcher;
      return this.findRelease().then(launcher => {
        if (launcher) return launcher;
        return this.findCanary();
      });
    });
  }

  findExact(executablePath: string): Promise<BrowserLauncher> {
    return this.isExecutable(executablePath).then(isExecutable => {
      if (isExecutable) {
        return this.createLauncher("exact", executablePath);
      }
    });
  }

  findRelease(): Promise<BrowserLauncher | undefined> {
    return Promise.resolve(undefined);
  }

  findCanary(): Promise<BrowserLauncher | undefined> {
    return Promise.resolve(undefined);
  }

  findReleaseExecutable(): Promise<BrowserLauncher | undefined> {
    return Promise.resolve(undefined);
  }

  createLauncher(browserType: string, executablePath: string): BrowserLauncher {
    let isContentShell = this.isContentShell(executablePath);
    return new DesktopBrowserLauncher(this.host, browserType, executablePath, isContentShell);
  }

  contentShellName(): string {
    switch (this.host.platform) {
      case "darwin":
        return MAC_CONTENT_SHELL_NAME;
      case "win32":
        return WINDOWS_CONTENT_SHELL_NAME;
      default:
        return LINUX_CONTENT_SHELL_NAME;
    }
  }

  isContentShell(executablePath: string): boolean {
    return executablePath.endsWith(this.contentShellName());
  }

  isExecutable(executablePath: string): Promise<boolean> {
    if (!executablePath) {
      return Promise.resolve(false);
    }
    return this.host.isExecutable(executablePath);
  }
}