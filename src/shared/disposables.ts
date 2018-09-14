import Disposable from "../../types/disposable";

declare const console: any;

export default class Disposables implements Disposable {
  private disposables: Disposable[] = [];

  public add<T extends Disposable>(disposable: T): T {
    this.disposables.push(disposable);
    return disposable;
  }

  public async dispose(): Promise<void> {
    const { disposables } = this;
    let disposable: Disposable | undefined;
    while ((disposable = disposables.pop()) !== undefined) {
      try {
        await disposable.dispose();
      } catch (err) {
        // intentionally ignored because dispose meant to be called from finally
        // don't want to overwrite the error

        // tslint:disable-next-line:no-console
        console.error(err); // TODO something better like dispose error event
      }
    }
  }
}
