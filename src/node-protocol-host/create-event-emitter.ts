import { EventEmitter as NodeEventEmitter } from "events";
import { EventEmitter } from "../../types/protocol-host";

export default function createEventEmitter(): EventEmitter {
  return new NodeEventEmitter();
}
