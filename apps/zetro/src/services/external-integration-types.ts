import type { Kysely } from "kysely";

export type ZetroWebhookEvent =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "finding.created"
  | "finding.updated"
  | "loop.started"
  | "loop.completed"
  | "loop.cancelled"
  | "command.executed"
  | "approval.required";

export type ZetroWebhookProvider = "generic" | "github" | "slack";

export type ZetroWebhook = {
  id: string;
  name: string;
  provider: ZetroWebhookProvider;
  url: string;
  secret?: string;
  events: ZetroWebhookEvent[];
  enabled: boolean;
  filters?: ZetroWebhookFilters;
  createdAt: string;
  updatedAt: string;
};

export type ZetroWebhookFilters = {
  playbookIds?: string[];
  severityLevels?: string[];
  runStatuses?: string[];
};

export type ZetroWebhookDelivery = {
  id: string;
  webhookId: string;
  event: ZetroWebhookEvent;
  payload: ZetroWebhookPayload;
  status: "pending" | "delivered" | "failed";
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
};

export type ZetroWebhookPayload = {
  event: ZetroWebhookEvent;
  timestamp: string;
  run?: {
    id: string;
    title: string;
    playbookId: string;
    status: string;
    summary: string;
  };
  finding?: {
    id: string;
    title: string;
    severity: string;
    category: string;
    status: string;
  };
  loop?: {
    id: string;
    currentIteration: number;
    status: string;
  };
  command?: {
    id: string;
    command: string;
    approved: boolean;
  };
};

export type ZetroGitHubConfig = {
  owner: string;
  repo: string;
  token?: string;
  defaultLabels?: string[];
  issueTemplate?: string;
};

export type ZetroGitHubIssue = {
  number?: number;
  title: string;
  body: string;
  labels?: string[];
  assignee?: string;
  milestone?: number;
};

export type ZetroSlackConfig = {
  webhookUrl?: string;
  botToken?: string;
  defaultChannel?: string;
  digestMode?: boolean;
  digestSchedule?: string;
};

export type ZetroSlackMessage = {
  channel?: string;
  text: string;
  blocks?: unknown[];
  attachments?: unknown[];
};

export type ZetroRunExport = {
  run: {
    id: string;
    title: string;
    playbookId: string;
    status: string;
    summary: string;
    outputMode?: string;
    createdAt: string;
    completedAt?: string;
  };
  events: Array<{
    sequence: number;
    kind: string;
    summary: string;
    detail?: string;
    createdAt: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
  }>;
  commandProposals: Array<{
    id: string;
    command: string;
    status: string;
  }>;
  summary: {
    totalEvents: number;
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    totalProposals: number;
    approvedProposals: number;
    executedProposals: number;
    duration?: string;
  };
};

export type ZetroCreateWebhookInput = {
  id?: string;
  name: string;
  provider?: ZetroWebhookProvider;
  url: string;
  secret?: string;
  events: ZetroWebhookEvent[];
  enabled?: boolean;
  filters?: ZetroWebhookFilters;
};

export type ZetroUpdateWebhookInput = {
  name?: string;
  url?: string;
  secret?: string;
  events?: ZetroWebhookEvent[];
  enabled?: boolean;
  filters?: ZetroWebhookFilters;
};

export type ZetroTriggerWebhookInput = {
  webhookId: string;
  event: ZetroWebhookEvent;
  payload: ZetroWebhookPayload;
};

export type ZetroListWebhooksOptions = {
  provider?: ZetroWebhookProvider;
  enabled?: boolean;
  event?: ZetroWebhookEvent;
};

export type ZetroDeliveryStatus = "pending" | "delivered" | "failed";

export type ZetroListDeliveriesOptions = {
  webhookId?: string;
  status?: ZetroDeliveryStatus;
  limit?: number;
};

export const ZETRO_WEBHOOK_EVENTS: readonly ZetroWebhookEvent[] = [
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "finding.created",
  "finding.updated",
  "loop.started",
  "loop.completed",
  "loop.cancelled",
  "command.executed",
  "approval.required",
] as const;

export const ZETRO_WEBHOOK_PROVIDERS: readonly ZetroWebhookProvider[] = [
  "generic",
  "github",
  "slack",
] as const;

export const DEFAULT_WEBHOOK_DELIVERY_TIMEOUT = 30000;
export const MAX_WEBHOOK_DELIVERY_ATTEMPTS = 3;
