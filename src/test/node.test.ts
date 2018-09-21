import test from "ava";
import * as execa from "execa";
import { createInterface } from "readline";
import { createProtocolClient } from "../index";

test("connect to node websocket", async t => {
  t.plan(3);

  const child = disableNdb(
    () =>
      execa("node", ["--inspect-brk=0", "src/test/fixtures/node-debug.js"], {
        buffer: false,
        stdio: ["ignore", "ignore", "pipe"],
      } as any), // types missing buffer: boolean
  );

  // exec a promise is for the lifetime of the promise
  // if the process exits or errors before finish we'll end
  // the test
  await Promise.race([child, (async () => {
    const wsUrl = await new Promise<string>(resolve => {
      // the websocket url is output on stderr
      const readline = createInterface({
        crlfDelay: Infinity,
        input: child.stderr,
      });

      readline.once("line", line => {
        const match = /Debugger listening on (ws:.*)$/.exec(line);
        if (match) {
          resolve(match[1]);
        }
      });
    });
    const client = await createProtocolClient(wsUrl);
    try {
      const exceptionThrown = client.until("Runtime.exceptionThrown");
      const raceException = <T>(promise: Promise<T>) => Promise.race([promise, exceptionThrown.then((evt) => {
        const txt = evt.exceptionDetails.exception && evt.exceptionDetails.exception.description || evt.exceptionDetails.text;
        throw new Error(txt);
      })]);

      // we need to send Debugger.enable before Runtime.runIfWaitingForDebugger
      // in order to receive the first break event but its promise will not resolve
      // until runIfWaitingForDebugger is sent, so we send all of the commands concurrently
      // then wait for them all.
      const [pauseOnStart] = await raceException(Promise.all([
          client.until("Debugger.paused"),
          client.send("Debugger.enable"),
          client.send("Runtime.enable"),
          client.send("Runtime.runIfWaitingForDebugger"),
        ]));

      t.is(pauseOnStart.reason, "Break on start");

      const [debuggerPause] = await raceException(Promise.all([
        client.until("Debugger.paused"),
        client.send("Debugger.resume"),
      ]));

      const { result } = await raceException(client.send("Debugger.evaluateOnCallFrame", {
        callFrameId: debuggerPause.callFrames[0].callFrameId,
        expression: "obj",
        returnByValue: true,
      }));

      t.deepEqual(result.value, { hello: "world" });

      const [consoleMessage] = await raceException(Promise.all([
        client.until("Runtime.consoleAPICalled"),
        client.send("Debugger.resume"),
      ]));

      t.deepEqual(consoleMessage.args, [
        {
          type: "string",
          value: "end",
        },
      ]);
    } finally {
      await client.disconnect();
      await client.disconnected;
    }
  })()]);
});

function disableNdb<T>(callback: () => T) {
  const NODE_OPTIONS = process.env.NODE_OPTIONS;
  process.env.NODE_OPTIONS = "";
  try {
    return callback();
  } finally {
    process.env.NODE_OPTIONS = NODE_OPTIONS;
  }
}
