import { z } from "zod";

export const workspaceHostSchema = z.object({
  configured: z.boolean(),
  envFile: z.string(),
  kind: z.enum(["api", "web", "desktop", "mobile"]),
  port: z.number().int().nonnegative(),
  running: z.boolean(),
  stage: z.enum(["registered", "configured", "running"]),
  target: z.string(),
  url: z.string(),
  workspace: z.string(),
});

export const workspaceDocumentationSchema = z.object({
  path: z.string(),
  scope: z.enum(["assist", "application"]),
  title: z.string(),
});

export const workspaceProjectSchema = z.object({
  category: z.enum(["business", "devkit", "platform"]),
  documentation: z.array(workspaceDocumentationSchema),
  hosts: z.array(workspaceHostSchema),
  id: z.string(),
  label: z.string(),
  owner: z.string(),
  providers: z.array(z.string()),
  stage: z.enum(["registered", "configured", "running"]),
});

export const workspaceSnapshotSchema = z.object({
  documentation: z.array(workspaceDocumentationSchema),
  generatedAt: z.string(),
  projects: z.array(workspaceProjectSchema),
  summary: z.object({
    configuredHosts: z.number().int().nonnegative(),
    documentationCount: z.number().int().nonnegative(),
    projectCount: z.number().int().nonnegative(),
    runningHosts: z.number().int().nonnegative(),
  }),
});

export type WorkspaceSnapshot = z.infer<typeof workspaceSnapshotSchema>;
