import { Host, Process, WebSocketConnection } from "../host";
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
import { DesktopBrowserTab } from "./desktop_browser_tab";

export class DesktopBrowser implements Browser {
  private tabs = new Map<string, DesktopBrowserTab>();

  constructor(
    private host: Host,
    private disposables: DisposableStack,
    private client: HttpDebuggingProtocolClient,
    public version: string) {
  }

  public static create(host: Host, disposables: DisposableStack, port: number): Promise<DesktopBrowser> {
    let httpClient = host.createHttpClient("localhost", port);
    let client = new HttpDebuggingProtocolClient(httpClient);
    return client.version().then(version => {
      return new DesktopBrowser(host, disposables, client, version.Browser);
    });
  }

  public listTabs(): Promise<BrowserTab[]> {
    return this.client.listTabs().then(tabs => {
      return tabs.map(tab => new DesktopBrowserTab(this.host, this.client, tab.id, tab.webSocketDebuggerUrl));
    });
  }

  public newTab(url?: string): Promise<BrowserTab> {
    throw Error();
  }

  private getOrCreateTab(id: string, webSocketDebuggerUrl: string | undefined) {
    let tab = this.tabs.get(id);
    if (!tab) {
      tab = new DesktopBrowserTab(this.host, this.client, id, webSocketDebuggerUrl);
      this.disposables.push(tab);
      this.tabs.set(id, tab);
    }
    return tab;
  }

  public dispose(): Promise<any> {
    return this.disposables.dispose();
  }
}
