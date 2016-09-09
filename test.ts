// import { ProtocolCodegen } from "./index";
// import * as ts from "typescript";
// import * as fs from "fs";

import { BrowserLauncher, LaunchBrowserOptions } from "./index";

async function main() {
  let launcher = new BrowserLauncher();

  console.assert(!!launcher, "created launcher");

  let browser = await launcher.launchBrowser({
    debuggingProtocol: {
      version: {
        major: "1", minor: "1"
      },
      domains: [{
        domain: "HeapProfiler",
        commands: [{
          name: "enable"
        }, {
          name: "disable"
        }, {
          name: "takeHeapSnapshot"
        }],
        events: [{
          name: "addHeapSnapshotChunk"
        }, {
          name: "reportHeapSnapshotProgress"
        }]
      }]
    }
  });

  let tabs = await browser.listTabs();
  console.log(tabs);
  let tab = tabs[0];

  await tab.activate();

  let conn = await tab.openDebuggingProtocol();

  let heapProfiler = conn.domain<HeapProfiler.Domain>("HeapProfiler");

  await heapProfiler.enable();

  let buffer = "";

  heapProfiler.addHeapSnapshotChunk = evt => buffer += evt.chunk;

  heapProfiler.reportHeapSnapshotProgress = evt => console.log("progress: ", evt.done / evt.total);

  await heapProfiler.takeHeapSnapshot({
    reportProgress: true
  });

  console.log(conn);
}

main().catch(err => {
  console.log(err.stack);
});

namespace HeapProfiler {
  export interface Domain {
    enable(): Promise<void>;
    disable(): Promise<void>;
    takeHeapSnapshot(params: Params.takeHeapSnapshot): Promise<void>;
    addHeapSnapshotChunk: Handlers.addHeapSnapshotChunk;
    reportHeapSnapshotProgress: Handlers.reportHeapSnapshotProgress;
  }

  export namespace Handlers {
    export type addHeapSnapshotChunk = (params: Params.addHeapSnapshotChunk) => void;
    export type reportHeapSnapshotProgress = (params: Params.reportHeapSnapshotProgress) => void;
  }

  export namespace Params {
    export type addHeapSnapshotChunk = {
      chunk: string;
    }
    export type reportHeapSnapshotProgress = {
      done: number;
      total: number;
      finished?: boolean;
    }
    export type takeHeapSnapshot = {
      reportProgress?: boolean;
    }
  }
}

// let protocol = JSON.parse(fs.readFileSync("test/protocol.json", "utf8"));

// function testProtocolGenTypescript(protocol: any) {
//   let codegen = new ProtocolCodegen({
//     clientModuleName: "../lib/debugging-protocol-client-factory",
//     typescript: true
//   });
//   let code = codegen.generate(protocol);
//   fs.writeFileSync("test/domains.ts", code);

//   let configObject = JSON.parse(fs.readFileSync("test/tsconfig.json", "utf8"));
//   let config = ts.parseJsonConfigFileContent(configObject, ts.sys, fs.realpathSync("test"));
//   let program = ts.createProgram(config.fileNames, config.options);
//   program.emit();
// }

// function testProtocolGenJS(protocol: any) {
//   let codegen = new ProtocolCodegen({
//     clientModuleName: "../lib/debugging-protocol-client-factory",
//     typescript: false
//   });
//   let code = codegen.generate(protocol);
//   fs.writeFileSync("dist/test/untyped-domains.js", code);
// }

// testProtocolGenTypescript(protocol);
// testProtocolGenJS(protocol);
