import {
  HttpClient,
  DebugFunction
} from "../host";

/**
 * Client for the HTTP API that Chrome serves when
 * launched with the --remote-debugging-port option.
 */
export class HttpDebuggingProtocolClient {
  constructor(private client: HttpClient) {
  }

  version(): Promise<VersionInfo> {
    return this.client.get("/json/version").then(JSON.parse);
  }

  listTabs(): Promise<Tab[]> {
    return this.client.get("/json/list").then(JSON.parse);
  }

  newTab(url?: string): Promise<Tab> {
    let path = "/json/new";
    if (url) {
      path += "?" + encodeURIComponent(url);
    }
    return this.client.get(path).then(JSON.parse);
  }

  activateTab(tabId: string): Promise<any> {
    return this.client.get(`/json/activate/${tabId}`);
  }

  closeTab(tabId: string): Promise<any> {
    return this.client.get(`/json/close/${tabId}`);
  }
}

export interface Tab {
  id: string;
  webSocketDebuggerUrl?: string | undefined;
  description?: string | undefined;
  devtoolsFrontendUrl?: string | undefined;
  faviconUrl?: string | undefined;
  title?: string | undefined;
  type?: string | undefined;
  url?: string | undefined;
}

export interface VersionInfo {
  "Browser": string;
  "Protocol-Version": string;
  "User-Agent": string;
  "WebKit-Version": string;
}
