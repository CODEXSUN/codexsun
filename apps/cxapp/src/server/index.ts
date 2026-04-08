import "./restart-token.js"

import { pathToFileURL } from "node:url"

import { startFrameworkServerWithOptions } from "../../../framework/src/server/index.js"

import { startCxappBackgroundRuntime } from "./background-runtime.js"

export function startCxAppServer(cwd = process.cwd()) {
  return startFrameworkServerWithOptions(cwd, {
    onReady: ({ config, databases, logger }) =>
      startCxappBackgroundRuntime({
        config,
        databases,
        logger,
      }),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startCxAppServer()
}
