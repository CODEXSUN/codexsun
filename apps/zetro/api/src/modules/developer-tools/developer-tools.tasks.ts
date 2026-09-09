import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

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
  const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['run', script], {
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
    child.once('exit', (code) => {
      const exitCode = code ?? 1
      if (exitCode === 0) resolve({ exitCode, output: redact(output), script })
      else reject(new Error(redact(output).trim() || `${script} exited with code ${exitCode}.`))
    })
    signal.addEventListener('abort', () => child.kill(), { once: true })
  })
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
