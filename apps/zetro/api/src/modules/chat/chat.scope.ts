import { realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, win32 } from 'node:path'
import type { ChatWorkspaceScope } from './chat.conversation.types.js'

export async function validateChatWorkspaceScope(
  projectRoot: string,
  scope: ChatWorkspaceScope,
): Promise<ChatWorkspaceScope> {
  const folderPath = normalizeFolderPath(scope.folderPath)
  const segments = folderPath.split('/')
  if (segments.some((part) => !part || part === '.' || part === '..' || part.startsWith('.git'))) {
    throw new InvalidChatWorkspaceScopeError(
      'Use a direct application, package, or module path without traversal or Git metadata.',
    )
  }
  if (!['apps', 'packages'].includes(segments[0] ?? '') || !segments[1]) {
    throw new InvalidChatWorkspaceScopeError(
      'Choose one owner below apps/<application> or packages/<package>, not a shared root.',
    )
  }
  if (segments[0] === 'packages' && segments[1] !== scope.application.trim()) {
    throw new InvalidChatWorkspaceScopeError('Package must match the connected packages folder.')
  }
  if (segments[0] === 'apps' && segments[1] !== scope.application.trim()) {
    throw new InvalidChatWorkspaceScopeError(
      'Application must match the connected apps folder. Reconnect the correct folder.',
    )
  }
  const moduleIndex = segments.lastIndexOf('modules')
  if (moduleIndex >= 0 && segments[moduleIndex + 1] !== scope.module.trim()) {
    throw new InvalidChatWorkspaceScopeError('Module must match the connected module folder.')
  }
  if (!folderPath || folderPath === '.' || isAbsolute(folderPath) || win32.isAbsolute(folderPath)) {
    throw new InvalidChatWorkspaceScopeError('Choose a folder inside the project repository.')
  }

  const folder = resolve(projectRoot, folderPath)
  const relation = relative(resolve(projectRoot), folder)
  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new InvalidChatWorkspaceScopeError('The connected folder must stay inside the project.')
  }

  try {
    if (!(await stat(folder)).isDirectory()) throw new Error('not-directory')
    const physicalRelation = relative(await realpath(projectRoot), await realpath(folder))
    if (physicalRelation !== relation) throw new Error('redirected-folder')
  } catch {
    throw new InvalidChatWorkspaceScopeError('The connected folder does not exist.')
  }

  const documentationPaths = [...new Set((scope.documentationPaths ?? []).map(normalizeFolderPath))]
  if (documentationPaths.length > 8)
    throw new InvalidChatWorkspaceScopeError('Choose at most eight documentation folders.')
  for (const path of documentationPaths) {
    if (!/^assist\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
      throw new InvalidChatWorkspaceScopeError(
        'Documentation folders must be explicit paths below assist, not the repository root or another application.',
      )
    }
    const target = resolve(projectRoot, path)
    try {
      if (
        !(await stat(target)).isDirectory() ||
        relative(await realpath(projectRoot), await realpath(target)) !==
          relative(projectRoot, target)
      )
        throw new Error('invalid-directory')
    } catch {
      throw new InvalidChatWorkspaceScopeError(
        'An approved documentation folder does not exist or is redirected.',
      )
    }
  }
  return {
    ...(scope.documentationPaths ? { documentationPaths } : {}),
    application: scope.application.trim(),
    folderPath,
    module: scope.module.trim(),
  }
}

export class InvalidChatWorkspaceScopeError extends Error {}

function normalizeFolderPath(folderPath: string): string {
  return folderPath.trim().replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '')
}
