export default async function usingTimeout<T>(
  ms: number,
  using: (timeout: Promise<void>) => PromiseLike<T> | T,
): Promise<T> {
  let id: any;
  try {
    return await using(
      new Promise<void>(resolve => {
        id = setTimeout(resolve, ms);
      }),
    );
  } finally {
    if (id) {
      clearTimeout(id);
    }
  }
}
