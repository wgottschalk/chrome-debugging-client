import { ProtocolHost } from "../../types/protocol-host";
import createEventEmitter from "./create-event-emitter";
import createHttpGet from "./create-http-get";
import createWebSocket from "./create-web-socket";
import launchChrome from "./launch-chrome";

const host: ProtocolHost = {
  createEventEmitter,
  createHttpGet,
  createWebSocket,
  launchChrome,
};

export = host;
