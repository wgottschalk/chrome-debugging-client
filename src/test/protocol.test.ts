import test from "ava";
import { createProtocolClient, createRestClient, spawnChrome } from "../index";

const additionalArguments = [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--mute-audio",
  "--disable-logging",
];

test("test debugging protocol domains", async t => {
  t.plan(2);
  const chrome = await spawnChrome({
    additionalArguments,
    stdio: "ignore",
    windowSize: { width: 320, height: 640 },
  });
  try {
    const restApi = createRestClient("127.0.0.1", chrome.port);
    const target = await restApi.open();
    const client = await createProtocolClient(target.webSocketDebuggerUrl);
    try {
      let buffer = "";
      await client.send("HeapProfiler.enable");
      client.on("HeapProfiler.addHeapSnapshotChunk", params => {
        buffer += params.chunk;
      });
      await client.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });
      t.true(buffer.length > 0, "received chunks");
      const data = JSON.parse(buffer);
      t.truthy(data.snapshot.meta, "has snapshot");
    } finally {
      await client.dispose();
    }
  } finally {
    await chrome.dispose();
  }
});
