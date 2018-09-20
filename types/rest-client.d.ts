export namespace RestClient {
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

export interface RestClient {
  version(): Promise<RestClient.Version>;
  list(): Promise<RestClient.Target[]>;
  open(url?: string): Promise<RestClient.Target>;
  activate(id: string): Promise<void>;
  close(id: string): Promise<void>;
}

export default RestClient;
