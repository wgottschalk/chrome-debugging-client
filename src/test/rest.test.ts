import test from "ava";
import { spawnChrome, createRestClient } from "../index";

const additionalArguments = [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--mute-audio",
  "--disable-logging",
];

test("test REST API", async t => {
  const chrome = await spawnChrome({
    additionalArguments,
    stdio: "inherit",
    windowSize: { width: 320, height: 640 },
  });
  try {
    const client = createRestClient("127.0.0.1", chrome.port);
    const version = await client.version();
    t.truthy(version["Protocol-Version"], "has Protocol-Version");
    t.truthy(version["User-Agent"], "has User-Agent");
    const target = await client.open();
    t.truthy(target, "open returned a new target");
    t.truthy(target.id, "target has id");
    await client.activate(target.id);
    const targets = await client.list();
    t.truthy(targets, "list returned targets");
    t.true(Array.isArray(targets), "targets isArray");
    t.truthy(
      targets.find(other => other.id === target.id),
      "targets from list contains target from open",
    );
    await client.close(target.id);
  } finally {
    chrome.exit();
    await chrome.exited;
  }
});
