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
export const ownedPath = z.string().trim().min(1).max(1024).refine((value) => !value.startsWith("/") && !value.includes("\\") && !value.includes(":") && !value.split("/").includes("..") && value !== ".", "Use repository-relative owned paths.");
export const taskInput = z.object({
  idempotencyKey: z.string().uuid(), title: z.string().trim().min(1).max(80), prompt: z.string().trim().min(1).max(20000),
  appName: z.string().trim().min(1).max(120), repositoryProfileId: z.string().uuid(), ownedPaths: z.array(ownedPath).min(1).max(32),
  acceptanceCriteria: z.string().trim().min(1).max(10000), executionProfileId: z.string().min(1).max(120), parentTaskId: z.string().uuid().optional(),
});
export const messageInput = z.object({ messageId: z.string().uuid(), prompt: z.string().trim().min(1).max(20000), expectedTaskRevision: z.number().int().nonnegative(), createdAt: z.string().datetime() }).strict();
export const decisionInput = z.object({
  idempotencyKey: z.string().uuid(), expectedTaskRevision: z.number().int().nonnegative(), evidenceId: z.string().min(1),
  approvedCommitSha: z.string().regex(/^[a-f0-9]{40,64}$/u).optional(), comment: z.string().max(4000).default(""),
  pullRequestId: z.string().min(1).optional(), expectedHeadSha: z.string().regex(/^[a-f0-9]{40,64}$/u).optional(),
}).strict();
export const task = z.object({
  id: z.string().uuid(), title: z.string(), prompt: z.string(), appName: z.string(), repository: z.string(), ownedPaths: z.array(z.string()),
  status: z.string(), createdAt: z.string(), report: z.string().default(""), repositoryProfileId: z.string().optional(), baseCommitSha: z.string().optional(),
  taskRevision: z.number().int().nonnegative().optional(), evidenceId: z.string().optional(), commitSha: z.string().optional(),
  diff: z.string().optional(), testOutput: z.string().optional(), changedFiles: z.array(z.string()).nullish(), previewUrl: z.string().optional(), previewStatus: z.string().optional(),
  workspaceResumable: z.boolean().optional(), parentTaskId: z.string().optional(),
  mergeRequest: z.object({ externalId: z.string().optional(), url: z.string().optional(), status: z.string(), sourceBranch: z.string(), baseBranch: z.string(), headSha: z.string().optional() }).optional(),
});
export const repository = z.object({ id: z.string(), name: z.string(), repository: z.string(), gitConnectionId: z.string(), defaultBranch: z.string(), mirrorStatus: z.string(), commitSha: z.string().optional() });
export const connection = z.object({ id: z.string(), name: z.string(), provider: z.string(), secretConfigured: z.boolean(), repositoryPatterns: z.array(z.string()), permissions: z.object({ clone: z.boolean(), pull: z.boolean(), push: z.boolean() }) });
export const event = z.object({ id: z.string(), taskId: z.string(), type: z.string(), message: z.string(), createdAt: z.string(), status: z.string().optional() });
export const overview = z.object({
  containerId: z.string().optional(), containerName: z.string().optional(), version: z.string().optional(),
  tasks: z.array(task).nullish().transform((value) => value ?? []),
  repositories: z.array(repository).nullish().transform((value) => value ?? []),
  gitConnections: z.array(connection).nullish().transform((value) => value ?? []),
  controlCapabilities: z.array(z.string()).default([]),
  executionProfiles: z.array(z.object({ id: z.string(), name: z.string(), install: z.string(), test: z.string(), build: z.string(), preview: z.string() })).default([]),
  credentialEncryptionConfigured: z.boolean().default(false),
});
export type PortalTask = z.infer<typeof task>;
export type PortalOverview = z.infer<typeof overview>;
export class PortalError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
