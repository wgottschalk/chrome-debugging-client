import { Host } from "../host";
import { BrowserFinder, BrowserLauncher, BrowserFinderOptions } from "../browser";

const concat = Array.prototype.concat;

export class BrowserMultifinder implements BrowserFinder {
  private finders: BrowserFinder[];

  constructor(finders: BrowserFinder[]) {
    this.finders = finders;
  }

  availableTypes(options: BrowserFinderOptions): Promise<string[]> {
    let promises = this.finders.map(finder => finder.availableTypes(options));
    return Promise.all(promises).then(results => concat(results));
  }

  availableLaunchers(options: BrowserFinderOptions): Promise<BrowserLauncher[]> {
    throw new Error("not implemented");
  }

  findLauncher(options: BrowserFinderOptions): Promise<BrowserLauncher> {
    let promise = Promise.resolve<BrowserLauncher | undefined>(undefined);
    this.finders.forEach(finder => {
      promise = promise.then(launcher => {
        if (launcher !== undefined) {
          return launcher;
        }
        return finder.findLauncher(options);
      });
    });
    return promise;
  }
}
