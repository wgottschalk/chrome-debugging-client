import { ProtocolHost } from "../types/protocol-host";

declare const require: (mod: string) => any;

let host: ProtocolHost | undefined;
export default function defaultHost() {
  if (host === undefined) {
    host = require("./node-protocol-host") as ProtocolHost;
  }
  return host;
}
