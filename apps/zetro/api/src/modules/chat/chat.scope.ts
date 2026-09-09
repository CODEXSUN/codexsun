import { stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, win32 } from 'node:path'
import type { ChatWorkspaceScope } from './chat.conversation.types.js'

export async function validateChatWorkspaceScope(
  projectRoot: string,
  scope: ChatWorkspaceScope,
): Promise<ChatWorkspaceScope> {
  const folderPath = normalizeFolderPath(scope.folderPath)
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
  } catch {
    throw new InvalidChatWorkspaceScopeError('The connected folder does not exist.')
  }

  return {
    application: scope.application.trim(),
    folderPath,
    module: scope.module.trim(),
  }
}

export class InvalidChatWorkspaceScopeError extends Error {}

function normalizeFolderPath(folderPath: string): string {
  return folderPath.trim().replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '')
}
