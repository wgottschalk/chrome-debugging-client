export namespace ProtocolClient {
  export type Target = Record<
    | "description"
    | "devtoolsFrontendUrl"
    | "faviconUrl"
    | "id"
    | "title"
    | "type"
    | "url"
    | "webSocketDebuggerUrl",
    string
  > & {
    [key: string]: string | undefined;
  };

  export type Version = Record<"Browser" | "Protocol-Version", string> &
    Partial<
      Record<
        "User-Agent" | "V8-Version" | "WebKit-Version" | "webSocketDebuggerUrl",
        string
      >
    > & {
      [key: string]: string | undefined;
    };
}

export interface ProtocolClient {
  version(): Promise<ProtocolClient.Version>;
  list(): Promise<ProtocolClient.Target[]>;
  open(url?: string): Promise<ProtocolClient.Target>;
  activate(id: string): Promise<void>;
  close(id: string): Promise<void>;
}

export default ProtocolClient;
