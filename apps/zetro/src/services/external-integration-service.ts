import { randomUUID } from "node:crypto";
import { createHmac } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";
import { getZetroRunWithDetails, type ZetroRun } from "./run-service.js";
import type {
  ZetroWebhook,
  ZetroWebhookDelivery,
  ZetroWebhookEvent,
  ZetroWebhookProvider,
  ZetroWebhookPayload,
  ZetroCreateWebhookInput,
  ZetroUpdateWebhookInput,
  ZetroTriggerWebhookInput,
  ZetroListWebhooksOptions,
  ZetroListDeliveriesOptions,
  ZetroGitHubConfig,
  ZetroGitHubIssue,
  ZetroSlackConfig,
  ZetroSlackMessage,
  ZetroRunExport,
} from "./external-integration-types.js";
import {
  DEFAULT_WEBHOOK_DELIVERY_TIMEOUT,
  MAX_WEBHOOK_DELIVERY_ATTEMPTS,
} from "./external-integration-types.js";

function assertWebhookEvent(event: string): asserts event is ZetroWebhookEvent {
  const validEvents: readonly string[] = [
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
  ];

  if (!validEvents.includes(event)) {
    throw new ApplicationError(`Invalid webhook event: ${event}`, {}, 400);
  }
}

function generateSignature(
  payload: string,
  secret: string,
  timestamp: number,
): string {
  const signaturePayload = `${timestamp}.${payload}`;
  const hmac = createHmac("sha256", secret);
  hmac.update(signaturePayload);
  return `sha256=${hmac.digest("hex")}`;
}

export async function createWebhook(
  database: Kysely<unknown>,
  input: ZetroCreateWebhookInput,
): Promise<ZetroWebhook> {
  if (!input.name?.trim()) {
    throw new ApplicationError("Webhook name is required.", {}, 400);
  }

  if (!input.url?.trim()) {
    throw new ApplicationError("Webhook URL is required.", {}, 400);
  }

  if (!input.events?.length) {
    throw new ApplicationError("At least one event type is required.", {}, 400);
  }

  for (const event of input.events) {
    assertWebhookEvent(event);
  }

  const records = await listStoreRecords<ZetroWebhook>(
    database,
    zetroTableNames.webhooks,
  );

  if (records.some((r) => r.id === input.id)) {
    throw new ApplicationError("Webhook id already exists.", {}, 409);
  }

  const webhook: ZetroWebhook = {
    id: input.id ?? `zetro-webhook-${randomUUID()}`,
    name: input.name.trim(),
    provider: input.provider ?? "generic",
    url: input.url.trim(),
    secret: input.secret,
    events: input.events,
    enabled: input.enabled ?? true,
    filters: input.filters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await replaceStoreRecords(database, zetroTableNames.webhooks, [
    ...records,
    {
      id: webhook.id,
      moduleKey: webhook.provider,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: webhook,
    },
  ]);

  return webhook;
}

export async function updateWebhook(
  database: Kysely<unknown>,
  webhookId: string,
  input: ZetroUpdateWebhookInput,
): Promise<ZetroWebhook> {
  const records = await listStoreRecords<ZetroWebhook>(
    database,
    zetroTableNames.webhooks,
  );

  const recordIndex = records.findIndex((r) => r.id === webhookId);

  if (recordIndex === -1) {
    throw new ApplicationError("Webhook not found.", { webhookId }, 404);
  }

  const webhook = records[recordIndex]!.payload;

  if (input.name !== undefined) webhook.name = input.name.trim();
  if (input.url !== undefined) webhook.url = input.url.trim();
  if (input.secret !== undefined) webhook.secret = input.secret;
  if (input.events !== undefined) {
    for (const event of input.events) {
      assertWebhookEvent(event);
    }
    webhook.events = input.events;
  }
  if (input.enabled !== undefined) webhook.enabled = input.enabled;
  if (input.filters !== undefined) webhook.filters = input.filters;
  webhook.updatedAt = new Date().toISOString();

  records[recordIndex] = { ...records[recordIndex]!, payload: webhook };

  await replaceStoreRecords(database, zetroTableNames.webhooks, records);

  return webhook;
}

export async function deleteWebhook(
  database: Kysely<unknown>,
  webhookId: string,
): Promise<void> {
  const records = await listStoreRecords<ZetroWebhook>(
    database,
    zetroTableNames.webhooks,
  );

  const filtered = records.filter((r) => r.id !== webhookId);

  if (filtered.length === records.length) {
    throw new ApplicationError("Webhook not found.", { webhookId }, 404);
  }

  await replaceStoreRecords(database, zetroTableNames.webhooks, filtered);
}

export async function getWebhook(
  database: Kysely<unknown>,
  webhookId: string,
): Promise<ZetroWebhook | null> {
  const records = await listStoreRecords<ZetroWebhook>(
    database,
    zetroTableNames.webhooks,
  );

  const record = records.find((r) => r.id === webhookId);

  return record?.payload ?? null;
}

export async function listWebhooks(
  database: Kysely<unknown>,
  options?: ZetroListWebhooksOptions,
): Promise<ZetroWebhook[]> {
  let webhooks = await listStorePayloads<ZetroWebhook>(
    database,
    zetroTableNames.webhooks,
  );

  if (options?.provider) {
    webhooks = webhooks.filter((w) => w.provider === options.provider);
  }

  if (options?.enabled !== undefined) {
    webhooks = webhooks.filter((w) => w.enabled === options.enabled);
  }

  if (options?.event) {
    webhooks = webhooks.filter((w) => w.events.includes(options.event!));
  }

  return webhooks;
}

export async function triggerWebhook(
  database: Kysely<unknown>,
  input: ZetroTriggerWebhookInput,
): Promise<ZetroWebhookDelivery> {
  const webhook = await getWebhook(database, input.webhookId);

  if (!webhook) {
    throw new ApplicationError(
      "Webhook not found.",
      { webhookId: input.webhookId },
      404,
    );
  }

  if (!webhook.enabled) {
    throw new ApplicationError(
      "Webhook is disabled.",
      { webhookId: input.webhookId },
      400,
    );
  }

  if (!webhook.events.includes(input.event)) {
    throw new ApplicationError(
      `Webhook does not listen for event: ${input.event}`,
      { webhookId: input.webhookId, event: input.event },
      400,
    );
  }

  if (webhook.filters) {
    if (input.payload.run) {
      if (
        webhook.filters.playbookIds?.length &&
        !webhook.filters.playbookIds.includes(input.payload.run.playbookId)
      ) {
        throw new ApplicationError(
          "Webhook filter mismatch: playbookId",
          {},
          400,
        );
      }
      if (
        webhook.filters.runStatuses?.length &&
        !webhook.filters.runStatuses.includes(input.payload.run.status)
      ) {
        throw new ApplicationError(
          "Webhook filter mismatch: run status",
          {},
          400,
        );
      }
    }
    if (input.payload.finding && webhook.filters.severityLevels?.length) {
      if (
        !webhook.filters.severityLevels.includes(input.payload.finding.severity)
      ) {
        throw new ApplicationError(
          "Webhook filter mismatch: severity",
          {},
          400,
        );
      }
    }
  }

  const payloadString = JSON.stringify(input.payload);
  const timestamp = Math.floor(Date.now() / 1000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Zetro-Event": input.event,
    "X-Zetro-Timestamp": String(timestamp),
  };

  if (webhook.secret) {
    headers["X-Zetro-Signature"] = generateSignature(
      payloadString,
      webhook.secret,
      timestamp,
    );
  }

  let status: ZetroWebhookDelivery["status"] = "pending";
  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let errorMessage: string | undefined;
  let deliveredAt: string | undefined;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(DEFAULT_WEBHOOK_DELIVERY_TIMEOUT),
    });

    statusCode = response.status;
    responseBody = await response.text().catch(() => undefined);

    if (response.ok) {
      status = "delivered";
      deliveredAt = new Date().toISOString();
    } else {
      status = "failed";
      errorMessage = `HTTP ${response.status}: ${responseBody?.slice(0, 200) ?? "No response body"}`;
    }
  } catch (error) {
    status = "failed";
    errorMessage = String(error);
  }

  const delivery: ZetroWebhookDelivery = {
    id: `zetro-delivery-${randomUUID()}`,
    webhookId: input.webhookId,
    event: input.event,
    payload: input.payload,
    status,
    statusCode,
    responseBody,
    errorMessage,
    attempts: 1,
    createdAt: new Date().toISOString(),
    deliveredAt,
  };

  const deliveryRecords = await listStoreRecords<ZetroWebhookDelivery>(
    database,
    zetroTableNames.webhookDeliveries,
  );

  await replaceStoreRecords(database, zetroTableNames.webhookDeliveries, [
    ...deliveryRecords,
    {
      id: delivery.id,
      moduleKey: input.webhookId,
      sortOrder: (deliveryRecords.at(-1)?.sortOrder ?? 0) + 10,
      payload: delivery,
    },
  ]);

  return delivery;
}

export async function listWebhookDeliveries(
  database: Kysely<unknown>,
  options?: ZetroListDeliveriesOptions,
): Promise<ZetroWebhookDelivery[]> {
  let deliveries = await listStorePayloads<ZetroWebhookDelivery>(
    database,
    zetroTableNames.webhookDeliveries,
  );

  if (options?.webhookId) {
    deliveries = deliveries.filter((d) => d.webhookId === options.webhookId);
  }

  if (options?.status) {
    deliveries = deliveries.filter((d) => d.status === options.status);
  }

  deliveries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (options?.limit) {
    deliveries = deliveries.slice(0, options.limit);
  }

  return deliveries;
}

export async function retryWebhookDelivery(
  database: Kysely<unknown>,
  deliveryId: string,
): Promise<ZetroWebhookDelivery> {
  const records = await listStoreRecords<ZetroWebhookDelivery>(
    database,
    zetroTableNames.webhookDeliveries,
  );

  const recordIndex = records.findIndex((r) => r.id === deliveryId);

  if (recordIndex === -1) {
    throw new ApplicationError(
      "Webhook delivery not found.",
      { deliveryId },
      404,
    );
  }

  const delivery = records[recordIndex]!.payload;

  if (delivery.attempts >= MAX_WEBHOOK_DELIVERY_ATTEMPTS) {
    throw new ApplicationError(
      "Maximum delivery attempts reached.",
      { deliveryId, attempts: delivery.attempts },
      400,
    );
  }

  const webhook = await getWebhook(database, delivery.webhookId);

  if (!webhook) {
    throw new ApplicationError(
      "Webhook not found.",
      { webhookId: delivery.webhookId },
      404,
    );
  }

  const payloadString = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(Date.now() / 1000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Zetro-Event": delivery.event,
    "X-Zetro-Timestamp": String(timestamp),
  };

  if (webhook.secret) {
    headers["X-Zetro-Signature"] = generateSignature(
      payloadString,
      webhook.secret,
      timestamp,
    );
  }

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(DEFAULT_WEBHOOK_DELIVERY_TIMEOUT),
    });

    delivery.statusCode = response.status;
    delivery.responseBody = await response.text().catch(() => undefined);

    if (response.ok) {
      delivery.status = "delivered";
      delivery.deliveredAt = new Date().toISOString();
      delivery.errorMessage = undefined;
    } else {
      delivery.errorMessage = `HTTP ${response.status}: ${delivery.responseBody?.slice(0, 200) ?? "No response body"}`;
    }
  } catch (error) {
    delivery.errorMessage = String(error);
  }

  delivery.attempts += 1;

  records[recordIndex] = { ...records[recordIndex]!, payload: delivery };

  await replaceStoreRecords(
    database,
    zetroTableNames.webhookDeliveries,
    records,
  );

  return delivery;
}

export async function createGitHubIssue(
  config: ZetroGitHubConfig,
  issue: ZetroGitHubIssue,
): Promise<{ number: number; url: string }> {
  if (!config.token) {
    throw new ApplicationError(
      "GitHub token is required for creating issues.",
      {},
      401,
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: issue.title,
        body: issue.body,
        labels: issue.labels ?? config.defaultLabels,
        assignee: issue.assignee,
        milestone: issue.milestone,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new ApplicationError(
      `GitHub API error: ${response.status}`,
      { status: response.status, error },
      response.status >= 500 ? 502 : 400,
    );
  }

  const data = (await response.json()) as { number: number; html_url: string };

  return { number: data.number, url: data.html_url };
}

export async function linkRunToPR(
  config: ZetroGitHubConfig,
  runId: string,
  prNumber: number,
  comment: string,
): Promise<{ id: number; url: string }> {
  if (!config.token) {
    throw new ApplicationError(
      "GitHub token is required for linking to PRs.",
      {},
      401,
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ body: comment }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new ApplicationError(
      `GitHub API error: ${response.status}`,
      { status: response.status, error },
      response.status >= 500 ? 502 : 400,
    );
  }

  const data = (await response.json()) as { id: number; html_url: string };

  return { id: data.id, url: data.html_url };
}

export async function postRunSummaryToPR(
  config: ZetroGitHubConfig,
  database: Kysely<unknown>,
  runId: string,
  prNumber: number,
): Promise<{ id: number; url: string }> {
  const runExport = await exportRun(database, runId);

  const comment = formatRunSummaryForGitHub(runExport);

  return linkRunToPR(config, runId, prNumber, comment);
}

function formatRunSummaryForGitHub(exportData: ZetroRunExport): string {
  const { run, findings, summary } = exportData;

  let body = `## Zetro Run Summary: ${run.title}\n\n`;
  body += `**Status:** ${run.status}\n`;
  body += `**Duration:** ${summary.duration ?? "N/A"}\n\n`;

  body += "### Findings Summary\n\n";
  body += `| Severity | Count |\n`;
  body += `|----------|-------|\n`;
  body += `| Critical | ${summary.criticalFindings} |\n`;
  body += `| High     | ${summary.highFindings} |\n`;
  body += `| Medium   | ${summary.mediumFindings} |\n`;
  body += `| Low      | ${summary.lowFindings} |\n\n`;

  if (findings.length > 0) {
    body += "### Findings\n\n";
    for (const finding of findings) {
      body += `- **[${finding.severity.toUpperCase()}]** ${finding.title}\n`;
      if (finding.category) {
        body += `  Category: ${finding.category}\n`;
      }
    }
  }

  body += `\n---\n`;
  body += `*Run ID: ${run.id} | Playbook: ${run.playbookId}*\n`;

  return body;
}

export async function sendSlackMessage(
  config: ZetroSlackConfig,
  message: ZetroSlackMessage,
): Promise<{ ts: string }> {
  if (!config.webhookUrl && !config.botToken) {
    throw new ApplicationError(
      "Slack webhook URL or bot token is required.",
      {},
      401,
    );
  }

  if (config.webhookUrl) {
    return sendSlackWebhookMessage(config.webhookUrl, message);
  }

  throw new ApplicationError(
    "Bot token Slack messaging not yet implemented.",
    {},
    501,
  );
}

async function sendSlackWebhookMessage(
  webhookUrl: string,
  message: ZetroSlackMessage,
): Promise<{ ts: string }> {
  const payload: Record<string, unknown> = {};

  if (message.channel) {
    payload.channel = message.channel;
  }

  payload.text = message.text;

  if (message.blocks) {
    payload.blocks = message.blocks;
  }

  if (message.attachments) {
    payload.attachments = message.attachments;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ApplicationError(
      `Slack webhook error: ${response.status}`,
      { status: response.status, error },
      response.status >= 500 ? 502 : 400,
    );
  }

  const data = (await response.json()) as { ts?: string };

  return { ts: data.ts ?? new Date().toISOString() };
}

export async function sendSlackAlert(
  config: ZetroSlackConfig,
  alert: {
    title: string;
    message: string;
    severity: "info" | "warning" | "error" | "critical";
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  },
): Promise<{ ts: string }> {
  const colorMap = {
    info: "#36a64f",
    warning: "#ff9800",
    error: "#f44336",
    critical: "#8b0000",
  };

  const emojiMap = {
    info: ":information_source:",
    warning: ":warning:",
    error: ":x:",
    critical: ":rotating_light:",
  };

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emojiMap[alert.severity]} ${alert.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: alert.message,
      },
    },
  ];

  if (alert.fields?.length) {
    const fieldBlocks = alert.fields.map((field) => ({
      type: "mrkdwn" as const,
      text: `*${field.title}*\n${field.value}`,
    }));

    blocks.push({
      type: "section",
      fields: fieldBlocks,
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent from Zetro • ${new Date().toISOString()}`,
      },
    ],
  });

  const attachment = {
    color: colorMap[alert.severity],
    blocks,
  };

  return sendSlackMessage(config, {
    text: alert.title,
    attachments: [attachment],
  });
}

export async function exportRun(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroRunExport> {
  const runWithDetails = await getZetroRunWithDetails(database, runId);

  if (!runWithDetails) {
    throw new ApplicationError("Run not found.", { runId }, 404);
  }

  const { events, findings, commandProposals, ...run } = runWithDetails;

  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    const severity = finding.severity.toLowerCase();
    if (severity === "critical") severityCounts.critical++;
    else if (severity === "high") severityCounts.high++;
    else if (severity === "medium") severityCounts.medium++;
    else if (severity === "low") severityCounts.low++;
  }

  let duration: string | undefined;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  if (sortedEvents.length > 0) {
    const completedEvent = events.find(
      (e) =>
        e.kind === "status" &&
        (e.detail?.includes("completed") || e.detail?.includes("failed")),
    );
    if (completedEvent) {
      const startTime = new Date(sortedEvents[0]!.createdAt).getTime();
      const endTime = new Date(completedEvent.createdAt).getTime();
      const diffMs = endTime - startTime;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffHour > 0) {
        duration = `${diffHour}h ${diffMin % 60}m`;
      } else if (diffMin > 0) {
        duration = `${diffMin}m ${diffSec % 60}s`;
      } else {
        duration = `${diffSec}s`;
      }
    }
  }

  const firstEvent = sortedEvents[0];
  const completedEvent = events.find(
    (e) =>
      e.kind === "status" &&
      (e.detail?.includes("completed") || e.detail?.includes("failed")),
  );

  return {
    run: {
      id: run.id,
      title: run.title,
      playbookId: run.playbookId,
      status: run.status,
      summary: run.summary,
      outputMode: run.outputMode,
      createdAt: firstEvent?.createdAt ?? new Date().toISOString(),
      completedAt: completedEvent?.createdAt,
    },
    events: events.map((e) => ({
      sequence: e.sequence,
      kind: e.kind,
      summary: e.summary,
      detail: e.detail,
      createdAt: e.createdAt,
    })),
    findings: findings.map((f) => ({
      id: f.id,
      title: f.title,
      category: f.category,
      severity: f.severity,
      status: f.status,
    })),
    commandProposals: commandProposals.map((p) => ({
      id: p.id,
      command: p.command,
      status: p.status,
    })),
    summary: {
      totalEvents: events.length,
      totalFindings: findings.length,
      criticalFindings: severityCounts.critical,
      highFindings: severityCounts.high,
      mediumFindings: severityCounts.medium,
      lowFindings: severityCounts.low,
      totalProposals: commandProposals.length,
      approvedProposals: commandProposals.filter((p) => p.status === "approved")
        .length,
      executedProposals: 0,
      duration,
    },
  };
}

export async function dispatchEventToWebhooks(
  database: Kysely<unknown>,
  event: ZetroWebhookEvent,
  payload: ZetroWebhookPayload,
): Promise<ZetroWebhookDelivery[]> {
  const webhooks = await listWebhooks(database, { event, enabled: true });

  const deliveries: ZetroWebhookDelivery[] = [];

  for (const webhook of webhooks) {
    try {
      const delivery = await triggerWebhook(database, {
        webhookId: webhook.id,
        event,
        payload,
      });
      deliveries.push(delivery);
    } catch (error) {
      console.error(
        `Failed to trigger webhook ${webhook.id} for event ${event}:`,
        error,
      );
    }
  }

  return deliveries;
}
