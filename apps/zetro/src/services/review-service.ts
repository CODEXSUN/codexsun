import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import type { ZetroFinding } from "./finding-service.js";
import {
  parseFindings,
  parseCommandProposals,
  type ZetroParsedFinding,
  type ZetroParsedCommandProposal,
} from "./prompt-builder.js";
import {
  detectReviewLane,
  mapSeverity,
  mapConfidence,
  ZETRO_REVIEW_LANES,
  type ZetroReviewLaneId,
  type ZetroReviewSeverity,
  type ZetroReviewFindingStatus,
  type ZetroPersistedReviewFinding,
} from "./review-lanes.js";

export type ZetroReviewFindingInput = {
  runId?: string;
  sessionId?: string;
  title: string;
  summary: string;
  category?: string;
  severity?: ZetroReviewSeverity;
  confidence?: number;
  file?: string;
  line?: number;
  laneId?: ZetroReviewLaneId;
};

export type ZetroReviewSummary = {
  total: number;
  open: number;
  accepted: number;
  dismissed: number;
  fixed: number;
  deferred: number;
  byLane: Record<ZetroReviewLaneId, number>;
  bySeverity: Record<ZetroReviewSeverity, number>;
};

export function createReviewFindingFromParsed(
  parsed: ZetroParsedFinding,
  options?: { runId?: string; sessionId?: string },
): ZetroReviewFindingInput {
  const laneId = detectReviewLane(parsed.title, parsed.summary);
  const severity =
    (parsed.severity as ZetroReviewSeverity) ||
    mapSeverity(parsed.title, parsed.summary, laneId);
  const confidence = mapConfidence(
    parsed.confidence,
    Boolean(parsed.file),
    Boolean(parsed.line),
  );

  return {
    runId: options?.runId,
    sessionId: options?.sessionId,
    title: parsed.title,
    summary: parsed.summary,
    category: parsed.category,
    severity,
    confidence,
    file: parsed.file,
    line: parsed.line,
    laneId,
  };
}

export function extractReviewFindingsFromContent(
  content: string,
  options?: { runId?: string; sessionId?: string },
): ZetroReviewFindingInput[] {
  const parsedFindings = parseFindings(content);
  return parsedFindings.map((parsed) =>
    createReviewFindingFromParsed(parsed, options),
  );
}

export function extractCommandProposalsFromContent(
  content: string,
  options?: { runId?: string; sessionId?: string },
): Array<ZetroParsedCommandProposal & { runId?: string; sessionId?: string }> {
  const proposals = parseCommandProposals(content);
  return proposals.map((proposal) => ({
    ...proposal,
    runId: options?.runId,
    sessionId: options?.sessionId,
  }));
}

export function buildReviewSummary(
  findings: ZetroPersistedReviewFinding[],
): ZetroReviewSummary {
  const summary: ZetroReviewSummary = {
    total: findings.length,
    open: 0,
    accepted: 0,
    dismissed: 0,
    fixed: 0,
    deferred: 0,
    byLane: {
      architecture: 0,
      security: 0,
      performance: 0,
      "code-quality": 0,
      testing: 0,
      documentation: 0,
      compliance: 0,
      general: 0,
    },
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
  };

  for (const finding of findings) {
    summary.byLane[finding.laneId]++;
    summary.bySeverity[finding.severity]++;

    switch (finding.status) {
      case "open":
        summary.open++;
        break;
      case "accepted":
        summary.accepted++;
        break;
      case "dismissed":
        summary.dismissed++;
        break;
      case "fixed":
        summary.fixed++;
        break;
      case "deferred":
        summary.deferred++;
        break;
    }
  }

  return summary;
}

export function getLaneDisplayName(laneId: ZetroReviewLaneId): string {
  const lane = ZETRO_REVIEW_LANES.find((l) => l.id === laneId);
  return lane?.name ?? laneId;
}

export function getSeverityBadgeVariant(severity: ZetroReviewSeverity): string {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

export function getStatusDisplayName(status: ZetroReviewFindingStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "accepted":
      return "Accepted";
    case "dismissed":
      return "Dismissed";
    case "fixed":
      return "Fixed";
    case "deferred":
      return "Deferred";
    default:
      return status;
  }
}

export const ZETRO_REVIEW_FINDING_STATUSES: ZetroReviewFindingStatus[] = [
  "open",
  "accepted",
  "dismissed",
  "fixed",
  "deferred",
];

export const ZETRO_REVIEW_SEVERITIES: ZetroReviewSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];
