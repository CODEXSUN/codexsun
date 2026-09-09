import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { EditorId, EditorOption } from './developer-tools.types.js'

const editorLabels = {
  cursor: 'Cursor',
  vscode: 'Visual Studio Code',
  windsurf: 'Windsurf',
} as const

export class DeveloperToolLaunchError extends Error {}

export async function listEditors(): Promise<EditorOption[]> {
  return Promise.all(
    (Object.keys(editorLabels) as Array<Exclude<EditorId, 'auto'>>).map(async (id) => ({
      available: Boolean(await resolveEditor(id)),
      id,
      label: editorLabels[id],
    })),
  )
}

export async function launchDeveloperTarget(
  repositoryPath: string,
  target: 'editor' | 'files' | 'terminal',
  editor: EditorId,
): Promise<void> {
  if (target === 'files') {
    await launch(process.platform === 'win32' ? 'explorer.exe' : 'xdg-open', [repositoryPath])
    return
  }
  if (target === 'terminal') {
    if (process.platform !== 'win32')
      throw new DeveloperToolLaunchError('Terminal launch is currently available on Windows.')
    await launch('wt.exe', ['-d', repositoryPath])
    return
  }
  const selected = editor === 'auto' ? await findFirstEditor() : await resolveEditor(editor)
  if (!selected)
    throw new DeveloperToolLaunchError('Install or select an available external editor.')
  await launch(selected, [repositoryPath])
}

async function findFirstEditor(): Promise<string | null> {
  for (const editor of ['vscode', 'cursor', 'windsurf'] as const) {
    const path = await resolveEditor(editor)
    if (path) return path
  }
  return null
}

async function resolveEditor(editor: Exclude<EditorId, 'auto'>): Promise<string | null> {
  const candidates = editorCandidates(editor)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Continue through the fixed, trusted editor locations.
    }
  }
  return null
}

function editorCandidates(editor: Exclude<EditorId, 'auto'>): string[] {
  const local = process.env.LOCALAPPDATA ?? ''
  const programFiles = process.env.ProgramFiles ?? ''
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? ''
  const definitions = {
    cursor: [['Programs', 'cursor', 'Cursor.exe']],
    vscode: [
      ['Programs', 'Microsoft VS Code', 'Code.exe'],
      ['Microsoft VS Code', 'Code.exe'],
    ],
    windsurf: [['Programs', 'Windsurf', 'Windsurf.exe']],
  } as const
  const bases = [local, programFiles, programFilesX86].filter(Boolean)
  return bases.flatMap((base) => definitions[editor].map((parts) => join(base, ...parts)))
}

function launch(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: false })
    child.once('error', (error) => reject(new DeveloperToolLaunchError(error.message)))
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}
