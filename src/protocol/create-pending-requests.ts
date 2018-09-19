export default async function usingPendingRequests<T, U>(
  using: (
    responseFor: (sendRequest: (id: number) => Promise<void>) => Promise<U>,
    resolveRequest: (id: number, response: U) => void,
  ) => Promise<T>,
): Promise<T> {
  let sequence = 0;
  const pending = new Map<number, ResponseCallback<U>>();

  const responsePromise = (id: number) => {
    return new Promise<U>((resolve, reject) => {
      pending.set(id, (err: Error | undefined, response?: U) => {
        if (err !== undefined) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  };

  const resolveRequest = (id: number, response: U) => {
    const callback = pending.get(id);
    if (callback) {
      callback(undefined, response);
    }
  };

  const responseFor = async (sendRequest: (id: number) => Promise<void>) => {
    const id = sequence++;
    try {
      const [response] = await Promise.all([
        responsePromise(id),
        sendRequest(id),
      ]);
      return response;
    } finally {
      pending.delete(id);
    }
  };

  try {
    return await using(responseFor, resolveRequest);
  } finally {
    if (pending.size > 0) {
      const callbacks = Array.from(pending.values());
      pending.clear();
      const disconnected = new Error("disconnected before command response");
      for (const callback of callbacks) {
        callback(disconnected);
      }
    }
  }
}

type ResponseCallback<T> = {
  (error: Error): void;
  (error: undefined, response: T): void;
};
