import { Host } from "../types/host";

export * from "./types";

let defaultHost: Host | undefined;

export function createDefaultHost(): Host {
  if (defaultHost === undefined) {
    defaultHost = require("./node-host/create-node-host").createDefaultHost() as Host;
  }
  return defaultHost;
}

declare const require: (mod: string) => any;
