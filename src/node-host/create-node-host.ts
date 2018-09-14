import { EventEmitter as NodeEventEmitter } from "events";
import { EventEmitter, Host } from "../../types/host";
import createHttpClient from "./create-http-client";
import launchChrome from "./launch-chrome";
import openWebSocket from "./open-web-socket";

function createEventEmitter(): EventEmitter {
  return new NodeEventEmitter();
}

export default function createNodeHost(): Host {
  return {
    createEventEmitter,
    createHttpClient,
    launchChrome,
    openWebSocket,
  };
}
