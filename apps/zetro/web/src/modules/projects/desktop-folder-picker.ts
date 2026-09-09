export async function pickDesktopRepositoryFolder(
  startPath: string,
): Promise<string | null | undefined> {
  if (!isDesktopHost()) return undefined
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<string | null>('pick_repository_folder', {
    startPath: startPath || null,
  })
}

export function isDesktopHost(): boolean {
  return '__TAURI_INTERNALS__' in window
}
