import { EventEmitter } from "../../types/host";

export function eventPromise<T>(
  emitter: EventEmitter,
  resolveEvent: string,
  rejectEvent: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const resolveHandler = (evt: T) => {
      resolve(evt);
      emitter.removeListener(resolveEvent, resolveHandler);
      emitter.removeListener(rejectEvent, rejectHandler);
    };
    const rejectHandler = (evt: any) => {
      reject(evt);
      emitter.removeListener(resolveEvent, resolveHandler);
      emitter.removeListener(rejectEvent, rejectHandler);
    };
    emitter.on(resolveEvent, resolveHandler);
    emitter.on(rejectEvent, rejectHandler);
  });
}
