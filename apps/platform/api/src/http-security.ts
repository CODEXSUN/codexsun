import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import { fastifyHelmetOptions } from "@codexsun/platform-core";

export async function registerHttpSecurity(app: FastifyInstance, allowedOrigin: string): Promise<void> {
  await app.register(helmet, fastifyHelmetOptions);
  await app.register(cors, {
    origin: allowedOrigin,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86_400,
  });
}
