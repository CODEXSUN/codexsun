import { z } from "zod";
import { connectionInput, repositoryInput } from "./portal-contracts.js";

export const commandId = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$/u);
const directory = z.string().max(512).default(".").refine((value) => !value.startsWith("/") && !value.includes("\\") && !value.includes(":") && !value.split("/").includes(".."));
const step = z.object({ argv: z.array(z.string().max(20000)).min(1).max(64), directory, timeoutSeconds: z.number().int().min(1).max(300).default(300) }).strict();
export const workspaceSetup = z.object({
  requestId: commandId, title: z.string().min(1).max(120), approved: z.literal(true), directory,
  repository: repositoryInput.omit({ gitConnectionId: true }).extend({ gitConnectionId: z.string().uuid().optional() }).optional(),
  environment: z.record(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u), z.string().max(8192)).default({}),
  preset: z.literal("zuno").optional(), databaseDriver: z.enum(["sqlite", "mariadb", "none"]).default("sqlite"), sqlitePath: directory.optional(),
  install: step, migrationStatus: step.optional(), migrate: step.optional(), migrationVerify: step.optional(), previewCommand: z.string().min(1).max(20000),
}).strict().superRefine((input, context) => {
  if (input.databaseDriver !== "none" && (!input.migrationStatus || !input.migrate || !input.migrationVerify)) context.addIssue({ code: "custom", message: "Database setup requires status, migrate, and verify commands." });
});
export const commands = z.object({ requestId: commandId, title: z.string().min(1).max(120), steps: z.array(step).min(1).max(32), previewCommand: z.string().max(20000).optional() }).strict();
export const provisionInput = z.object({ requestId: z.string().uuid(), name: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/u), setup: workspaceSetup.optional(), gitConnection: connectionInput.optional() }).strict();
export const dropInput = z.object({ requestId: z.string().uuid(), confirmed: z.literal(true) }).strict();
const profileCommand = z.string().min(1).max(20000);
export const workspaceProfileInput = z.object({
  name: z.string().min(1).max(120), repositoryName: z.string().min(1).max(120), repositoryUrl: z.string().min(1).max(2048), defaultBranch: z.string().min(1).max(120), directory,
  databaseDriver: z.enum(["sqlite", "mariadb", "none"]), sqlitePath: z.string().max(512).optional(),
  installCommand: profileCommand, migrationStatusCommand: profileCommand, migrateCommand: profileCommand, migrationVerifyCommand: profileCommand, previewCommand: profileCommand,
}).strict();
export const workspaceProfile = workspaceProfileInput.extend({ id: z.string().uuid(), savedAt: z.string().datetime() });
export const commandTask = z.object({ id: commandId, title: z.string(), status: z.string(), report: z.string().default(""), revision: z.number(), previewUrl: z.string().optional(), previewStatus: z.string().optional(), tools: z.object({ results: z.array(z.object({ output: z.string(), exitCode: z.number(), truncated: z.boolean() })).nullish() }).passthrough() }).passthrough();
