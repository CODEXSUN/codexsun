import { pathToFileURL } from "node:url"

import { startFrameworkServer } from "../../../framework/src/server/index.js"

export function startCxAppServer(cwd = process.cwd()) {
  return startFrameworkServer(cwd)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startCxAppServer()
}
