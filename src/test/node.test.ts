import test from "ava";
import * as execa from "execa";
import { createInterface } from "readline";
import { createProtocolClient } from "../index";

test("connect to node websocket", async t => {
  t.plan(4);

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
  await Promise.race([
    child,
    (async () => {
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
        const usingClient = (async () => {
          // we need to send Debugger.enable before Runtime.runIfWaitingForDebugger
          // in order to receive the first break event but its promise will not resolve
          // until runIfWaitingForDebugger is sent.
          //
          // So we send all of the commands concurrently then wait for them all.
          const [pauseOnStart] = await Promise.all([
            client.until("Debugger.paused"),
            client.send("Debugger.enable"),
            client.send("Runtime.enable"),
            client.send("Runtime.runIfWaitingForDebugger"),
          ]);

          t.is(
            pauseOnStart.reason,
            "Break on start",
            "inspect-brk should pause in script after runIfWaitingForDebugger",
          );

          // resume we expected resumed then paused from debugger on line 3
          const [debuggerPause] = await Promise.all([
            client.until("Debugger.paused"),
            client.until("Debugger.resumed"),
            client.send("Debugger.resume"),
          ]);

          t.is(
            debuggerPause.callFrames[0].location.lineNumber,
            3,
            "paused on line with debugger",
          );

          const { result } = await client.send("Debugger.evaluateOnCallFrame", {
            callFrameId: debuggerPause.callFrames[0].callFrameId,
            expression: "obj",
            returnByValue: true,
          });

          t.deepEqual(result.value, { hello: "world" });

          const [consoleMessage] = await Promise.all([
            client.until("Runtime.consoleAPICalled"),
            client.until("Debugger.resumed"),
            client.send("Debugger.resume"),
          ]);

          t.deepEqual(consoleMessage.args, [
            {
              type: "string",
              value: "end",
            },
          ]);
        })();
        await Promise.race([
          usingClient,
          client.until("Runtime.exceptionThrown", 0).then(evt => {
            const txt =
              (evt.exceptionDetails.exception &&
                evt.exceptionDetails.exception.description) ||
              evt.exceptionDetails.text;
            throw new Error(txt);
          }),
        ]);
      } finally {
        await client.dispose();
      }
    })(),
  ]);
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
