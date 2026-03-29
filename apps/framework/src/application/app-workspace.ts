export type AppWorkspaceDescriptor = {
  appId: string
  label: string
  backendRoot: string
  frontendRoot: string
  helperRoot: string
  sharedRoot: string
  migrationRoot: string
  seederRoot: string
}

export function defineAppWorkspace(
  appId: string,
  label: string
): AppWorkspaceDescriptor {
  const appRoot = `apps/${appId}`

  return {
    appId,
    label,
    backendRoot: `${appRoot}/src`,
    frontendRoot: `${appRoot}/web`,
    helperRoot: `${appRoot}/helper`,
    sharedRoot: `${appRoot}/shared`,
    migrationRoot: `${appRoot}/database/migration`,
    seederRoot: `${appRoot}/database/seeder`,
  }
}
