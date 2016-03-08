export interface Disposable {
  dispose(): Promise<any>;
}

export class DisposableStack {
  private disposables: Disposable[] = [];

  push(disposable: Disposable) {
    this.disposables.push(disposable);
  }

  dispose() {
    let disposeNext = (): Promise<void> | undefined => {
      let disposables = this.disposables;
      while (disposables.length > 0) {
        let disposable = disposables.pop();
        if (disposable) {
          return disposable.dispose().then(disposeNext, disposeNext);
        }
      }
    };
    return new Promise(resolve => resolve(disposeNext()));
  }
}
