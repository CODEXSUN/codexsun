import { constants } from 'node:fs'
import { access, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

interface ExecutableCandidate {
  modifiedAt: number
  path: string
}

export async function resolveCodexCommand(
  configuredCommand: string,
  platform: NodeJS.Platform = process.platform,
  localAppData = process.env.LOCALAPPDATA,
): Promise<string> {
  if (platform !== 'win32' || !isDefaultCommand(configuredCommand) || !localAppData) {
    return configuredCommand
  }

  const installationRoot = join(localAppData, 'OpenAI', 'Codex', 'bin')
  const candidates = await findDesktopExecutables(installationRoot)
  return candidates[0]?.path ?? configuredCommand
}

async function findDesktopExecutables(installationRoot: string): Promise<ExecutableCandidate[]> {
  const paths = [join(installationRoot, 'codex.exe')]

  try {
    const entries = await readdir(installationRoot, { withFileTypes: true })
    paths.push(
      ...entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(installationRoot, entry.name, 'codex.exe')),
    )
  } catch {
    return []
  }

  const candidates = await Promise.all(paths.map(readCandidate))
  return candidates
    .filter((candidate): candidate is ExecutableCandidate => candidate !== null)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)
}

async function readCandidate(path: string): Promise<ExecutableCandidate | null> {
  try {
    await access(path, constants.X_OK)
    const details = await stat(path)
    return { modifiedAt: details.mtimeMs, path }
  } catch {
    return null
  }
}

function isDefaultCommand(command: string): boolean {
  const normalized = command.trim().toLowerCase()
  return normalized === 'codex' || normalized === 'codex.exe'
}
