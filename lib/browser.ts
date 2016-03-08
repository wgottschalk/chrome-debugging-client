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
  url?: string;
  profilePath?: string;
  debuggingPort?: number;
  ignoreCertificateErrors?: boolean;
  disableV8IdleTasks?: boolean;
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
