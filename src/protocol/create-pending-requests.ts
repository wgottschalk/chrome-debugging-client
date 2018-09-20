export default function createPendingRequests<T>(): {
  responseFor: (
    sendRequest: (id: number) => Promise<void>,
    cancelled: Promise<never>,
  ) => Promise<T>;
  resolveRequest: (id: number, response: T) => void;
} {
  let sequence = 0;
  const pending = new Map<number, ResponseCallback<T>>();
  return {
    resolveRequest,
    responseFor,
  };

  function responsePromise(id: number) {
    return new Promise<T>((resolve, reject) => {
      pending.set(id, (err: Error | undefined, response?: T) => {
        if (err !== undefined) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  function resolveRequest(id: number, response: T) {
    const callback = pending.get(id);
    if (callback) {
      callback(undefined, response);
    }
  }

  async function responseFor(
    sendRequest: (id: number) => Promise<void>,
    cancelled: Promise<never>,
  ) {
    const id = sequence++;
    try {
      const [response] = await Promise.race([
        Promise.all([responsePromise(id), sendRequest(id)]),
        cancelled,
      ]);
      return response;
    } finally {
      pending.delete(id);
    }
  }
}

type ResponseCallback<T> = {
  (error: Error): void;
  (error: undefined, response: T): void;
};
