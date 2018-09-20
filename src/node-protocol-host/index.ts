import { ProtocolHost } from "../../types/protocol-host";
import createEventEmitter from "./create-event-emitter";
import createHttpGet from "./create-http-get";
import createTmpDir from "./create-tmp-dir";
import createWebSocket from "./create-web-socket";
import findChrome from "./find-chrome";
import spawnChrome from "./spawn-chrome";

const host: ProtocolHost = {
  createEventEmitter,
  createHttpGet,
  createTmpDir,
  createWebSocket,
  findChrome,
  spawnChrome,
};

export = host;
