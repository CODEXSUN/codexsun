import { z } from "zod";

export const serverInput = z.object({
  name: z.string().trim().min(1).max(120),
  apiUrl: z.string().url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/";
  }, "Use an HTTP(S) origin without credentials, query, or path."),
  credential: z.string().min(16).max(4096),
});
export const repositoryInput = z.object({
  name: z.string().trim().min(1).max(120),
  repository: z.string().url().refine((value) => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash; }),
  gitConnectionId: z.string().uuid(), defaultBranch: z.string().trim().min(1).max(255),
});
export const connectionInput = z.object({
  name: z.string().trim().min(1).max(120), provider: z.enum(["github", "gitlab", "bitbucket", "generic"]),
  username: z.string().max(120).default(""), token: z.string().min(1).max(8192),
  repositoryPatterns: z.array(z.string().min(1).max(1024)).min(1).max(32),
  permissions: z.object({ clone: z.boolean(), pull: z.boolean(), push: z.boolean() }),
});
export const commandSummary = z.object({
  id: z.string(), title: z.string(), status: z.string(), createdAt: z.string(),
  report: z.string().default(""), revision: z.number().int().optional(),
  previewUrl: z.string().optional(), previewStatus: z.string().optional(),
});
export const repository = z.object({
  id: z.string(), name: z.string(), repository: z.string(), gitConnectionId: z.string().default(""),
  defaultBranch: z.string(), workspaceStatus: z.string(), commitSha: z.string().optional(),
});
export const connection = z.object({
  id: z.string(), name: z.string(), provider: z.string(), secretConfigured: z.boolean(),
  repositoryPatterns: z.array(z.string()), permissions: z.object({ clone: z.boolean(), pull: z.boolean(), push: z.boolean() }),
});
export const overview = z.object({
  containerId: z.string().optional(), containerName: z.string().optional(), version: z.string().optional(),
  tasks: z.array(commandSummary).nullish().transform((value) => value ?? []),
  repositories: z.array(repository).nullish().transform((value) => value ?? []),
  gitConnections: z.array(connection).nullish().transform((value) => value ?? []),
  credentialEncryptionConfigured: z.boolean().default(false),
});
export type PortalOverview = z.infer<typeof overview>;
export class PortalError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
