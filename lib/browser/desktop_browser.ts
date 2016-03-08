import { Host, Process } from "../host";
import {
  BrowserFinderOptions,
  BrowserFinder,
  BrowserLauncher,
  Browser,
  BrowserTab,
  DebuggingProtocolConnection
} from "../browser";
import { DisposableStack } from "../common/disposable";
import { HttpDebuggingProtocolClient, VersionInfo } from "../debugging_protocol_client/http_client";

export class DesktopBrowser implements Browser {
  constructor(
    private host: Host,
    private disposables: DisposableStack,
    private client: HttpDebuggingProtocolClient,
    public version: string) {
  }

  static create(host: Host, disposables: DisposableStack, port: number): Promise<DesktopBrowser> {
    let httpClient = host.createHttpClient("localhost", port);
    let client = new HttpDebuggingProtocolClient(httpClient);
    return client.version().then(version => {
      return new DesktopBrowser(host, disposables, client, version.Browser);
    });
  }

  listTabs(): Promise<BrowserTab[]> {
    return this.client.listTabs().then(tabs => {
      return tabs.map(tab => new DesktopBrowserTab(this.host, this.client, tab.id, tab.webSocketDebuggerUrl));
    });
  }

  newTab(url?: string): Promise<BrowserTab> {
    throw new Error("not implemented");
  }

  dispose(): Promise<any> {
    return this.disposables.dispose();
  }
}

export class DesktopBrowserTab implements BrowserTab {
  constructor(
    private host: Host,
    private client: HttpDebuggingProtocolClient,
    public id: string,
    public webSocketDebuggerUrl: string | undefined) {
  }

  openDebuggingProtocol(): Promise<DebuggingProtocolConnection> {
    throw new Error("not implemented");
  }

  activate(): Promise<void> {
    return this.client.activateTab(this.id);
  }

  close(): Promise<void> {
    return this.client.closeTab(this.id)
  }

  dispose(): Promise<void> {
    return Promise.resolve();
  }
}