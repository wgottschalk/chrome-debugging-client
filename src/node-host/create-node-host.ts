import { EventEmitter as NodeEventEmitter } from "events";
import { EventEmitter, Host } from "../../types/host";
import createHttpClient from "./create-http-client";
import createWebSocket from "./create-web-socket";
import launchChrome from "./launch-chrome";

function createEventEmitter(): EventEmitter {
  return new NodeEventEmitter();
}

export default function createNodeHost(): Host {
  return {
    createEventEmitter,
    createHttpClient,
    createWebSocket,
    launchChrome,
  };
}
