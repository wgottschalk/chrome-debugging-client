import { Host, TemporaryDirectory, Process } from "../host";
import {
  BrowserLauncher,
  BrowserLauncherOptions,
  Browser
} from "../browser";
import { Disposable, DisposableStack } from "../common/disposable";
import { HttpDebuggingProtocolClient } from "../debugging_protocol_client/http_client";
import { DesktopBrowser } from "./desktop_browser";

export class DesktopBrowserLauncher implements BrowserLauncher {
  constructor(
    private host: Host,
    public browserType: string,
    private executablePath: string,
    public isContentShell: boolean) {
  }

  public launchBrowser(options: BrowserLauncherOptions): Promise<Browser> {
    let disposables = new DisposableStack();

    let resolveProfilePaths = () => {
      let path = options && options.profilePath;
      if (path) {
        let paths = profilePaths(path);
        return this.cleanupStalePortFile(paths.portPath).then(() => paths);
      }
      return this.createTmpProfile().then(tmpDir => {
        disposables.push(tmpDir);
        return profilePaths(tmpDir.path);
      });
    };

    let execute = (paths: ProfilePaths) => {
      let args = this.argsFor(options, paths.profilePath);
      return this.execute(args).then(process => {
        disposables.push(process);
        return paths;
      });
    };

    let resolvePort = (paths: ProfilePaths) => {
      return retry(() => {
        return delay(200).then(() => this.readPortFile(paths.portPath));
      }, 10);
    };

    let createBrowser = (port: number) => {
      return DesktopBrowser.create(this.host, disposables, port);
    };

    return resolveProfilePaths()
      .then(execute)
      .then(resolvePort)
      .then(createBrowser)
      .catch(e => {
        // cleanup disposables if we fail to create browser
        disposables.dispose();
        throw e;
      });
  }

  protected argsFor(options: BrowserLauncherOptions | undefined, profilePath: string): string[] {
    let url = options && options.url;

    let debuggingPort = 0;
    if (options && options.debuggingPort) {
      debuggingPort = options.debuggingPort;
    }

    let args = [
      // better control via script and
      // allows proccesses to write to io that wouldn't normally be allowed
      "--no-sandbox",
      // disable script hang monitor
      "--disable-hang-monitor",
      "--disable-notifications",
      // breakpad dialog
      "--noerrdialogs",
      // disables Chrome scheduling GC during idle
      // TODO make this optional
      "--disable-v8-idle-tasks",
      // disallows caching between context
      // this affects shared code between iframe but
      // it also allows caching between tests
      // TODO make this optional
      "--v8-cache-options=none",
      "--remote-debugging-port=" + debuggingPort
    ];

    if (options && options.ignoreCertificateErrors) {
      args.push("--ignore-certificate-errors");
    }

    let size = (options && options.windowSize) || {
      width: 414,
      height: 736
    };

    if (this.isContentShell) {
      args.push("--data-path=" + profilePath);
      args.push(`--content-shell-host-window-size=${size.width}x${size.height}`);
    } else {
      args.push(
        "--user-data-dir=" + profilePath,
        `--window-size=${size.width}x${size.height}`,
        // disable alert if previous session crashed
        // doesnt matter if tmp profile
        "--disable-session-crashed-bubble",
        // disable about:flags
        "--no-experiments",
        // skip first run tasks
        "--no-first-run",
        // don't install default apps on first run
        "--disable-default-apps",
        "--no-default-browser-check",
        // only matter with profile that has google account
        // disables syncing browser settings
        "--disable-sync",
        // don't submit metrics to Google
        "--metrics-recording-only",
        "--disable-component-extensions-with-background-pages",
        "--disable-background-networking",
        "--safebrowsing-disable-auto-update",
        // for automation
        "--disable-prompt-on-repost",
        // don't create domain reliability monitoring service
        "--disable-domain-reliability",
        // disable whether page should be translated
        "--disable-translate",
        // TODO make optional
        "--disable-extensions"
      );
    }

    args.push(
      url || "about:blank"
    );

    return args;
  }

  protected cleanupStalePortFile(portPath: string) {
    return this.host.deleteFile(portPath).catch(() => {
      // ignore, doesnt exist
    });
  }

  protected createTmpProfile(): Promise<TemporaryDirectory> {
    return this.host.createTmpDir();
  }

  protected execute(args: string[]): Promise<Process> {
    return this.host.exec(this.executablePath, args);
  }

  protected readPortFile(portPath: string): Promise<number> {
    return this.host.readFile(portPath).then(str => parsePort(str));
  }
}

type ProfilePaths = {
  profilePath: string;
  portPath: string;
};

function profilePaths(path: string): ProfilePaths {
  let normalized = normalizePath(path);
  return {
    profilePath: normalized,
    portPath: normalized + "/DevToolsActivePort"
  };
};

function parsePort(str: string): number {
  let port = parseInt(str, 10);
  if (isNaN(port)) {
    throw Error("failed to parse port");
  }
  return port;
}

function retry<T>(op: () => Promise<T>, attempts: number): Promise<T> {
  return op().catch(err => {
    if (attempts > 0) {
      return retry(op, attempts - 1);
    }
  });
}

function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
