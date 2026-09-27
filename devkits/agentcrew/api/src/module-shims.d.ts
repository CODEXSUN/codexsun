declare module "mysql2" {
  // The installed mysql2 package is missing its bundled declaration entrypoint.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createPool(connectionUrl: string): any
}
