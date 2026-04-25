import assert from "node:assert/strict"
import test from "node:test"

import { runDatabaseHelper } from "../../apps/cli/src/database-helper.ts"

function withPatchedConsole(run: (messages: {
  errors: string[]
  infos: string[]
}) => Promise<void> | void) {
  const originalInfo = console.info
  const originalError = console.error
  const messages = {
    errors: [] as string[],
    infos: [] as string[],
  }

  console.info = (...args: unknown[]) => {
    messages.infos.push(args.map(String).join(" "))
  }
  console.error = (...args: unknown[]) => {
    messages.errors.push(args.map(String).join(" "))
  }

  return Promise.resolve()
    .then(() => run(messages))
    .finally(() => {
      console.info = originalInfo
      console.error = originalError
    })
}

test("database helper refuses fresh without explicit confirmation", async () => {
  const previousExitCode = process.exitCode
  process.exitCode = undefined

  try {
    await withPatchedConsole(async (messages) => {
      await runDatabaseHelper(process.cwd(), ["fresh"])

      assert.equal(process.exitCode, 1)
      assert.equal(
        messages.errors.some((message) =>
          message.includes("Refusing db:fresh without confirmation")
        ),
        true
      )
    })
  } finally {
    process.exitCode = previousExitCode
  }
})

test("database helper prints usage for an unknown command", async () => {
  const previousExitCode = process.exitCode
  process.exitCode = undefined

  try {
    await withPatchedConsole(async (messages) => {
      await runDatabaseHelper(process.cwd(), ["unknown-command"])

      assert.equal(process.exitCode, 1)
      assert.equal(
        messages.infos.some((message) =>
          message.includes("[prepare|migrate|seed|status|fresh] [--yes]")
        ),
        true
      )
    })
  } finally {
    process.exitCode = previousExitCode
  }
})
