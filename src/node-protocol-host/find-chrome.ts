import * as chromeFinder from "chrome-launcher/dist/chrome-finder";
import { getPlatform } from "chrome-launcher/dist/utils";

export default function findChrome(): string {
  const platform = getPlatform() as keyof typeof chromeFinder;
  let chromePath: string | undefined;
  if (isFinder(platform)) {
    const paths = chromeFinder[platform]();
    if (paths.length > 0) {
      chromePath = paths[0];
    }
  }
  if (chromePath === undefined) {
    throw new Error("unable to find chrome installation");
  }

  return chromePath;
}

function isFinder(
  platform: ReturnType<typeof getPlatform>,
): platform is keyof typeof chromeFinder {
  return platform in chromeFinder;
}
