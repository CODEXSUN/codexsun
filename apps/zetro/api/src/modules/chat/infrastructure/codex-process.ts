import { spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function resolveChatWorkingDirectory() {
  const path = join(tmpdir(), 'zetro-codex-chat')
  mkdirSync(path, { recursive: true })
  return path
}

export function resolveCodexExecutable() {
  const configuredPath = process.env.ZETRO_CODEX_PATH
  if (configuredPath && existsSync(configuredPath)) return configuredPath
  if (process.platform !== 'win32') return 'codex'

  const pathMatch = spawnSync('where.exe', ['codex.exe'], { encoding: 'utf8', windowsHide: true })
    .stdout?.split(/\r?\n/)
    .find((candidate) => candidate && existsSync(candidate))
  if (pathMatch) return pathMatch

  const installRoot = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin')
    : ''
  const installedExecutables =
    installRoot && existsSync(installRoot)
      ? readdirSync(installRoot)
          .map((folder) => join(installRoot, folder, 'codex.exe'))
          .filter(existsSync)
          .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
      : []
  if (installedExecutables[0]) return installedExecutables[0]
  throw new Error('Codex CLI was not found. Install Codex or set ZETRO_CODEX_PATH.')
}

export function stopProcessTree(child: ChildProcessWithoutNullStreams) {
  if (!child.pid || child.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }
  child.kill('SIGTERM')
}

export function waitForSpawn(child: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', reject)
  })
}
