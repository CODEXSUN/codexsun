import { z } from "zod";

const schema = z.object({
  AGENTCREW_TOKEN: z.string().min(32),
  AGENTCREW_HOST: z.string().default("127.0.0.1"),
  AGENTCREW_PORT: z.coerce.number().int().min(1024).max(65535).default(6410),
  OLLAMA_URL: z.string().url().default("http://127.0.0.1:11434"),
  QDRANT_URL: z.string().url().default("http://127.0.0.1:6333"),
  AGENTCREW_MODEL: z
    .string()
    .regex(/^[\w.:-]+$/u)
    .default("qwen3:4b"),
  AGENTCREW_EMBED_MODEL: z
    .string()
    .regex(/^[\w.:-]+$/u)
    .default("nomic-embed-text"),
});

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  return schema.parse(environment);
}

export type Configuration = ReturnType<typeof readConfig>;
