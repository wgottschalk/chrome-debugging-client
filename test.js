"use strict";

const child_process = require("child_process");

let child = child_process.execFile("/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome", [
  "--no-default-browser-check",
  "--ignore-certificate-errors",
  "--metrics-recording-only",
  "--no-sandbox",
  "--no-experiments",
  "--disable-component-extensions-with-background-pages",
  "--disable-background-networking",
  "--disable-extensions",
  "--disable-default-apps",
  "--noerrdialogs",
  "--no-default-browser-check",
  "--disable-translate",
  "--no-first-run",
  "--js-flags=\"--trace-hydrogen --trace-phase=Z --trace-deopt --code-comments --hydrogen-track-positions --redirect-code-traces\"",
  "https://www.linkedin.com/m/"
], {
  encoding: "utf8"
});

console.log("pid", child.pid);

child.on("error", err => {
  console.log(err);
});

child.on("exit", (code, signal) => {
  console.log("child exited with: ", code, signal);
  setTimeout(() => {}, 1000);
});

child.stdout.removeAllListeners("data");
child.stderr.removeAllListeners("data");

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
