import { Disposable } from "./common/disposable";
import { Protocol } from "./debugging_protocol/json_interface";

export interface BrowserFinderOptions {
  browserType: string;
  browserExecutable: string;
}

export interface BrowserFinder {
  availableTypes(options: BrowserFinderOptions): Promise<string[]>;
  availableLaunchers(options: BrowserFinderOptions): Promise<BrowserLauncher[]>;
  findLauncher(options: BrowserFinderOptions): Promise<BrowserLauncher>;
}

export interface BrowserLauncherOptions {
  /*
    Definition for debugging protocol.
    JSON Object of domain name to collection of
    commands, events and types.
   */
  debuggingProtocol?: Protocol;

  /*
    URL to start the browser with. URL can be set later via
    debugging protocol.
   */
  url?: string;

  /*
    Path to the user data directory to start the browser with.
    It is best just to let this default to a temporary directory.
   */
  profilePath?: string;

  /*
    Port to connect to for inspecting tabs via HTTP.
    Better to let this default to an ephemeral port.
   */
  debuggingPort?: number;

  /*
    Useful for testing.
   */
  ignoreCertificateErrors?: boolean;

  /*
    Disable Chrome explicitly scheduling GC during idle.
    V8 still will GC.
   */
  disableV8IdleTasks?: boolean;

  /*
    Set window size, explicit window size helps with rendering variance.
   */
  windowSize?: {
    width: number;
    height: number;
  };
}

export interface BrowserLauncher {
  browserType: string;
  isContentShell: boolean;
  launchBrowser(options: BrowserLauncherOptions): Promise<Browser>;
}

export interface Browser extends Disposable {
  version: string;
  listTabs(): Promise<BrowserTab[]>;
  newTab(url?: string): Promise<BrowserTab>;
}

export interface BrowserTab extends Disposable {
  openDebuggingProtocol(): Promise<DebuggingProtocolConnection>;
  activate(): Promise<void>;
  close(): Promise<void>;
}

export interface DebuggingProtocolConnection extends Disposable {
  domain<T>(domain: string): T;
  domain(domain: string): any;
}
