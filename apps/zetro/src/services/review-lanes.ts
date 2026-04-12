export type ZetroReviewLaneId =
  | "architecture"
  | "security"
  | "performance"
  | "code-quality"
  | "testing"
  | "documentation"
  | "compliance"
  | "general";

export type ZetroReviewLane = {
  id: ZetroReviewLaneId;
  name: string;
  description: string;
  keywords: string[];
  defaultSeverity: ZetroReviewSeverity;
};

export type ZetroReviewSeverity = "low" | "medium" | "high" | "critical";

export type ZetroReviewFindingStatus =
  | "open"
  | "accepted"
  | "dismissed"
  | "fixed"
  | "deferred";

export type ZetroPersistedReviewFinding = {
  id: string;
  runId?: string;
  sessionId?: string;
  laneId: ZetroReviewLaneId;
  title: string;
  summary: string;
  category: string;
  severity: ZetroReviewSeverity;
  confidence: number;
  file?: string;
  line?: number;
  status: ZetroReviewFindingStatus;
  createdAt: string;
  updatedAt: string;
};

export const ZETRO_REVIEW_LANES: ZetroReviewLane[] = [
  {
    id: "architecture",
    name: "Architecture",
    description:
      "System design, component relationships, and architectural patterns.",
    keywords: [
      "architecture",
      "design",
      "structure",
      "component",
      "pattern",
      "module",
      "interface",
      "abstraction",
    ],
    defaultSeverity: "high",
  },
  {
    id: "security",
    name: "Security",
    description:
      "Vulnerabilities, injection risks, authentication, authorization, and data protection.",
    keywords: [
      "security",
      "vulnerability",
      "injection",
      "xss",
      "sql",
      "auth",
      "permission",
      "sensitive",
      "secret",
      "token",
      "csrf",
    ],
    defaultSeverity: "critical",
  },
  {
    id: "performance",
    name: "Performance",
    description:
      "N+1 queries, missing indexes, memory leaks, and inefficient algorithms.",
    keywords: [
      "performance",
      "slow",
      "n+1",
      "memory-leak",
      "inefficient",
      "index",
      "cache",
      "latency",
      "bottleneck",
    ],
    defaultSeverity: "high",
  },
  {
    id: "code-quality",
    name: "Code Quality",
    description:
      "Type safety, error handling, code smells, and maintainability.",
    keywords: [
      "type-safety",
      "any",
      "unknown",
      "error-handling",
      "dead-code",
      "duplication",
      "complexity",
      "refactor",
    ],
    defaultSeverity: "medium",
  },
  {
    id: "testing",
    name: "Testing",
    description: "Test coverage, missing tests, and test quality.",
    keywords: [
      "test",
      "coverage",
      "no-test",
      "assertion",
      "mock",
      "brittle",
      "unit-test",
      "integration-test",
    ],
    defaultSeverity: "medium",
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Missing docs, outdated docs, and unclear comments.",
    keywords: [
      "documentation",
      "undocumented",
      "outdated",
      "unclear",
      "comment",
      "readme",
      "docstring",
      "api",
    ],
    defaultSeverity: "low",
  },
  {
    id: "compliance",
    name: "Compliance",
    description:
      "Regulatory requirements, licensing, and standards compliance.",
    keywords: [
      "license",
      "gdpr",
      "hipaa",
      "pci",
      "compliance",
      "regulatory",
      "standard",
      "copyright",
    ],
    defaultSeverity: "high",
  },
  {
    id: "general",
    name: "General",
    description: "General findings that don't fit other lanes.",
    keywords: [
      "fixme",
      "todo",
      "hack",
      "deprecated",
      "warning",
      "suggestion",
      "improve",
    ],
    defaultSeverity: "medium",
  },
];

export function getReviewLane(
  id: ZetroReviewLaneId,
): ZetroReviewLane | undefined {
  return ZETRO_REVIEW_LANES.find((lane) => lane.id === id);
}

export function detectReviewLane(
  findingTitle: string,
  findingSummary: string,
): ZetroReviewLaneId {
  const text = `${findingTitle} ${findingSummary}`.toLowerCase();

  for (const lane of ZETRO_REVIEW_LANES) {
    for (const keyword of lane.keywords) {
      if (text.includes(keyword)) {
        return lane.id;
      }
    }
  }

  return "general";
}

export function mapSeverity(
  findingTitle: string,
  findingSummary: string,
  laneId?: ZetroReviewLaneId,
): ZetroReviewSeverity {
  const text = `${findingTitle} ${findingSummary}`.toLowerCase();

  if (laneId) {
    const lane = getReviewLane(laneId);
    if (lane) {
      for (const keyword of lane.keywords) {
        if (text.includes(keyword)) {
          return lane.defaultSeverity;
        }
      }
      return lane.defaultSeverity;
    }
  }

  for (const lane of ZETRO_REVIEW_LANES) {
    for (const keyword of lane.keywords) {
      if (text.includes(keyword)) {
        return lane.defaultSeverity;
      }
    }
  }

  return "medium";
}

export function mapConfidence(
  modelConfidence?: number,
  hasFile?: boolean,
  hasLine?: boolean,
): number {
  let confidence = modelConfidence ?? 75;

  if (!hasFile) {
    confidence = Math.max(50, confidence - 20);
  }

  if (!hasLine) {
    confidence = Math.max(40, confidence - 10);
  }

  return Math.min(100, confidence);
}
