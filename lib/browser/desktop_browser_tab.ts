import { Host, WebSocketConnection } from "../host";
import { BrowserTab, DebuggingProtocolConnection } from "../browser";
import { HttpDebuggingProtocolClient } from "../debugging_protocol_client/http_client";

export class DesktopBrowserTab implements BrowserTab {
  private isClosed = false;
  private connection: DebuggingProtocolConnection | undefined = undefined;

  constructor(
    private host: Host,
    private client: HttpDebuggingProtocolClient,
    public id: string,
    public webSocketDebuggerUrl: string | undefined) {
  }

  public supportsDebuggingProtocol(): boolean {
    return !!this.webSocketDebuggerUrl;
  }

  public openDebuggingProtocol(): Promise<DebuggingProtocolConnection> {
    if (this.connection) {
      return Promise.resolve(this.connection);
    }
    return this.checkWebSocketDebuggerUrl().then(url => {
      return this.host.openWebSocket(url).then(connection => {
        return this.connection = new BrowserTabConnection(connection);
      });
    });
  }

  public activate(): Promise<void> {
    return this.checkClosed().then(() => {
      return this.client.activateTab(this.id);
    });
  }

  public close(): Promise<void> {
    if (this.isClosed) {
      return Promise.resolve();
    }
    this.isClosed = true;
    return this.client.closeTab(this.id);
  }

  public dispose(): Promise<void> {
    return this.close();
  }

  private checkWebSocketDebuggerUrl(): Promise<string> {
    return new Promise<string>(resolve => {
      let url = this.webSocketDebuggerUrl;
      if (!url) {
        throw new Error("Tab does not support debugging protocol");
      }
      resolve(url);
    });
  }

  private checkClosed(): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.isClosed) {
        throw new Error("Tab already closed");
      }
      resolve();
    });
  }
}

class BrowserTabConnection implements DebuggingProtocolConnection {
  constructor(private connection: WebSocketConnection) {
  }

  domain(domain: string): any {
    return;
  }

  dispose(): Promise<void> {
    return this.connection.dispose();
  }
}
