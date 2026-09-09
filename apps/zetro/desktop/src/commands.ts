export interface ZetroDesktopStatus {
  apiUrl: string
  appDataDirectory: string
  logFile: string
  runtimeOwner: 'desktop' | 'existing'
  sessionToken: string
  version: string
  worktreeDirectory: string
}

export interface ZetroDesktopCommands {
  desktop_status: {
    result: ZetroDesktopStatus
  }
  pick_repository_folder: {
    input: { startPath: string | null }
    result: string | null
  }
}
