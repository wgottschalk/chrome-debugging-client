import { BrowserMultifinder } from "./browser/browser_multifinder";
import { DesktopBrowserFinder } from "./browser/desktop_browser_finder";
import { Browser, BrowserFinder, BrowserFinderOptions, BrowserLauncherOptions } from "./browser";
import { Host } from "./host";
import { createNodeHost } from "./host/node_host";

export interface LaunchBrowserOptions extends BrowserFinderOptions, BrowserLauncherOptions {
}

export class BrowserLauncher {
  private finder: BrowserFinder;
  private host: Host;

  constructor(_host?: Host) {
    let host = this.host = _host || createNodeHost();
    this.finder = new BrowserMultifinder([
      new DesktopBrowserFinder(host)
    ]);
  }

  launchBrowser(opts?: LaunchBrowserOptions | undefined): Promise<Browser> {
    let browserType = opts && opts.browserType;
    let browserExecutable = opts && opts.browserExecutable;
    if (!browserExecutable) {
      browserExecutable = this.host.getEnvironmentVariable("CHROME_BIN");
    }
    if (!browserType) {
      browserType = browserExecutable ? "exact" : "any";
    }
    return this.finder.findLauncher({
      browserType: browserType,
      browserExecutable: browserExecutable
    }).then(launcher => {
      if (!launcher) {
        throw new Error("Unable to find a browser for " + browserType);
      }
      return launcher.launchBrowser(opts || {});
    });
  }
}
