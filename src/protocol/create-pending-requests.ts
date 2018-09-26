export default function createPendingRequests<T>(): {
  responseFor: (sendRequest: (id: number) => Promise<void>) => Promise<T>;
  resolveRequest: (id: number, response: T) => void;
} {
  let sequence = 0;
  const pending = new Map<number, (response: T) => void>();
  return {
    resolveRequest,
    responseFor,
  };

  function resolveRequest(id: number, response: T) {
    const callback = pending.get(id);
    if (callback) {
      pending.delete(id);
      callback(response);
    }
  }

  async function responseFor(sendRequest: (id: number) => Promise<void>) {
    const id = sequence++;
    const responsePromise = new Promise<T>(resolve => pending.set(id, resolve));
    const [response] = await Promise.all([responsePromise, sendRequest(id)]);
    return response;
  }
}
