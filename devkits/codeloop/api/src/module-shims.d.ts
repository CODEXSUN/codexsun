declare module "@fastify/helmet" {
  import type { FastifyPluginCallback } from "fastify"

  const helmet: FastifyPluginCallback<Record<string, unknown>>
  export default helmet
}

declare module "mysql2" {
  // The published package in this install is missing its bundled typings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createPool(connectionUrl: string): any
}
