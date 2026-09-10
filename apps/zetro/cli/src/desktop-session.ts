import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { ZetroCliClient } from './client.js'
import { runCommand } from './commands.js'

/** Keeps the pairing token in this launcher and the desktop process only. */
export async function runDesktopSession(executable: string | undefined): Promise<void> {
  if (!executable) throw new Error('Supply the release desktop executable path.')
  const path = resolve(executable)
  await access(path)
  await requireFreePort()
  const token = randomBytes(32).toString('hex')
  const child = spawn(path, [], {
    env: { ...process.env, ZETRO_SUPERVISOR_TOKEN: token },
    windowsHide: true,
    stdio: 'ignore',
  })
  const client = new ZetroCliClient({ apiUrl: 'http://127.0.0.1:16050', supervisorToken: token })
  let exited = false
  child.once('exit', () => {
    exited = true
  })
  child.once('error', () => {
    exited = true
  })
  await waitForDesktop(
    new ZetroCliClient({
      apiUrl: 'http://127.0.0.1:16050',
      supervisorToken: token,
      timeoutMs: 1_000,
    }),
    () => exited,
  )
  const write = (value: unknown) => process.stdout.write(`${JSON.stringify(value)}\n`)
  write({ ready: true, apiUrl: 'http://127.0.0.1:16050', desktopPid: child.pid })
  const lines = createInterface({ input: process.stdin, terminal: false })
  child.once('exit', () => {
    lines.close()
    process.stdin.pause()
  })
  for await (const line of lines) {
    if (!line.trim()) continue
    try {
      const args: unknown = JSON.parse(line)
      if (
        !Array.isArray(args) ||
        !args.every((arg) => typeof arg === 'string') ||
        args[0] !== 'supervisor'
      ) {
        throw new Error('Send a JSON string array starting with supervisor.')
      }
      await runCommand(args as string[], { client, write })
    } catch (error) {
      write({ error: error instanceof Error ? error.message : 'Supervisor command failed.' })
    }
  }
  child.unref()
}

async function requireFreePort(): Promise<void> {
  const server = createServer()
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', () =>
      reject(
        new Error(
          'Close the existing Zetro desktop before starting a supervisor session. Port 16050 is occupied.',
        ),
      ),
    )
    server.listen(16050, '127.0.0.1', resolveListen)
  })
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()))
}

async function waitForDesktop(client: ZetroCliClient, exited: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (exited())
      throw new Error('The release desktop stopped during startup. Inspect its runtime log.')
    try {
      await client.get('/api/v1/supervisor/capabilities')
      return
    } catch {
      /* The API is still starting. */
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  throw new Error(
    'The desktop supervisor did not become available. Inspect the desktop runtime log.',
  )
}
