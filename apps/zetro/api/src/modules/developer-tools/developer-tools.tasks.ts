import { spawn } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { delimiter, dirname, join } from 'node:path'

const allowedScriptPattern = /^(build|check|clean|lint|release|test|typecheck)(:|$)/u

export async function listRepositoryScripts(repositoryPath: string): Promise<string[]> {
  const pkg = JSON.parse(await readFile(join(repositoryPath, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>
  }
  return Object.keys(pkg.scripts ?? {})
    .filter((name) => allowedScriptPattern.test(name))
    .sort()
}

export async function runRepositoryScript(
  repositoryPath: string,
  script: string,
  signal: AbortSignal,
): Promise<{ exitCode: number; output: string; script: string }> {
  const scripts = await listRepositoryScripts(repositoryPath)
  if (!scripts.includes(script)) throw new Error(`The repository does not expose ${script}.`)
  signal.throwIfAborted()
  const npmCli = await findNpmCli()
  signal.throwIfAborted()

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', script], {
      cwd: repositoryPath,
      env: safeEnvironment(),
      shell: false,
      windowsHide: true,
    })
    let output = ''
    const collect = (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-200_000)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.once('error', reject)
    const stop = () => {
      if (!child.pid || child.exitCode !== null) return
      if (process.platform === 'win32') {
        const stopper = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        })
        stopper.once('error', () => child.kill())
      } else child.kill('SIGTERM')
    }
    child.once('close', (code) => {
      signal.removeEventListener('abort', stop)
      const exitCode = code ?? 1
      if (signal.aborted) reject(new Error('Repository script was cancelled.'))
      else if (exitCode === 0) resolve({ exitCode, output: redact(output), script })
      else reject(new Error(redact(output).trim() || `${script} exited with code ${exitCode}.`))
    })
    signal.addEventListener('abort', stop, { once: true })
    if (signal.aborted) stop()
  })
}

async function findNpmCli(): Promise<string> {
  const directories = [dirname(process.execPath), ...(process.env.PATH ?? '').split(delimiter)]
  const candidates = [
    process.env.npm_execpath,
    ...directories.flatMap((directory) => [
      join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      join(directory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ]),
  ]
  for (const candidate of candidates) {
    if (!candidate || !candidate.endsWith('npm-cli.js')) continue
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next explicit Node installation path.
    }
  }
  throw new Error(
    'Install Node.js with npm and add its directory to PATH before running repository scripts.',
  )
}

function safeEnvironment(): NodeJS.ProcessEnv {
  const allowed = [
    'APPDATA',
    'CI',
    'ComSpec',
    'LOCALAPPDATA',
    'NODE_ENV',
    'PATH',
    'PATHEXT',
    'SystemRoot',
    'TEMP',
    'TMP',
    'USERPROFILE',
  ]
  return Object.fromEntries(
    allowed.map((key) => [key, process.env[key]]).filter((entry) => entry[1]),
  )
}

function redact(value: string): string {
  return value
    .replace(/(authorization|api[-_]?key|password|token)\s*[:=]\s*[^\s]+/giu, '$1=[redacted]')
    .replace(/https?:\/\/[^\s:@]+:[^\s@]+@/gu, 'https://[redacted]@')
}
