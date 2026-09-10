#!/usr/bin/env node
import { ZetroCliClient } from './client.js'
import { runCommand } from './commands.js'
import { runDesktopSession } from './desktop-session.js'

const args = process.argv.slice(2)
const json = takeFlag(args, '--json')
const apiUrl = takeOption(args, '--api') ?? process.env.ZETRO_API_URL ?? 'http://127.0.0.1:6050'
const sessionToken = process.env.ZETRO_SESSION_TOKEN
const client = new ZetroCliClient({
  apiUrl,
  sessionToken,
  supervisorToken: process.env.ZETRO_SUPERVISOR_TOKEN,
})

const execution =
  args[0] === 'desktop-session'
    ? runDesktopSession(args[1])
    : runCommand(args, {
        client,
        write: (value) => process.stdout.write(`${format(value, json)}\n`),
      })
execution.catch((error: unknown) => {
  process.stderr.write(
    `Zetro CLI error: ${error instanceof Error ? error.message : 'Unknown error.'}\n`,
  )
  process.exitCode = 1
})

function format(value: unknown, json: boolean): string {
  if (typeof value === 'string' && !json) return value
  return JSON.stringify(value, null, json ? 0 : 2)
}

function takeFlag(args: string[], name: string): boolean {
  const index = args.indexOf(name)
  if (index < 0) return false
  args.splice(index, 1)
  return true
}

function takeOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index < 0) return undefined
  const value = args[index + 1]
  args.splice(index, value === undefined ? 1 : 2)
  return value
}
