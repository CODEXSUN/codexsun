export interface DesktopPlatformAdapter {
  getVersion(): Promise<string>
}
