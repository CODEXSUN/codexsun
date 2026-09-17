import type { FastifyInstance } from "fastify";

export type ServerShutdown = () => Promise<void>;

export function createServerShutdown(app: FastifyInstance): ServerShutdown {
  let closing: Promise<void> | undefined;
  return () => {
    closing ??= app.close();
    return closing;
  };
}

export function installServerShutdownHandlers(shutdown: ServerShutdown): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown().catch((error: unknown) => {
        console.error(`Platform API shutdown failed after ${signal}.`, error);
        process.exitCode = 1;
      });
    });
  }
}
