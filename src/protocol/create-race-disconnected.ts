import { UsingTimeout } from "../../types/protocol-host";

export type RaceDisconnected = {
  // tslint:disable-next-line:callable-types
  <T>(promise: Promise<T>, label: string, timeout?: number): Promise<T>;
};

export default function createRaceDisconnected(
  disconnected: Promise<void>,
  defaultTimeout: number,
  usingTimeout: UsingTimeout,
): RaceDisconnected {
  return <T>(
    promise: Promise<T>,
    label: string,
    timeout: number = defaultTimeout,
  ): Promise<T> => {
    if (timeout === 0) {
      return Promise.race([
        promise,
        disconnected.then(() => {
          throw new Error(`disconnected while waiting for ${label}`);
        }),
      ]);
    }
    return usingTimeout(timeout, timedout =>
      Promise.race([
        promise,
        disconnected.then(() => {
          throw new Error(`disconnected while waiting for ${label}`);
        }),
        timedout.then(() => {
          throw new Error(`timed out while waiting for ${label}`);
        }),
      ]),
    );
  };
}
