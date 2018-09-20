import { EventEmitter as NodeEventEmitter } from "events";
import { EventEmitter, ProtocolHost } from "../../types/protocol-host";
import createHttpClient from "./create-http-client";
import launchChrome from "./launch-chrome";
import openWebSocket from "./open-web-socket";

function createEventEmitter(): EventEmitter {
  return new NodeEventEmitter();
}

const host: ProtocolHost = {
  createEventEmitter,
  createHttpClient,
  launchChrome,
  openWebSocket,
};

export = host;
