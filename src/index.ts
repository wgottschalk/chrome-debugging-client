// import ProtocolClient from "../types/protocol-client";
import defaultHost from "./default-host";
import _createProtocolClient from "./protocol/create-protocol-client";
import _createRestClient from "./protocol/create-rest-client";

export { default as spawnChrome } from "./spawn-chrome";

export function createRestClient(
  host: string,
  port: number,
  createHttpGet = defaultHost().createHttpGet,
) {
  return _createRestClient(createHttpGet(host, port));
}

export async function createProtocolClient(
  wsUrl: string,
  createEventEmitter = defaultHost().createEventEmitter,
  createWebSocket = defaultHost().createWebSocket,
) {
  const eventEmitter = createEventEmitter();
  const connect = createWebSocket(wsUrl);
  return await _createProtocolClient(eventEmitter, connect);
}
