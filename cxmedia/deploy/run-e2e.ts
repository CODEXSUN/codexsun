import { execSync } from "node:child_process"
import process from "node:process"

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx"

function run(command: string) {
  execSync(command, {
    shell: true,
    stdio: "inherit",
  })
}

try {
  run(`${npmCommand} run cxmedia:docker:up`)
  run(`${npxCommand} playwright test -c cxmedia/playwright.config.ts`)
} finally {
  run(`${npmCommand} run cxmedia:docker:down`)
}
