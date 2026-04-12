export type ZetroTaskType =
  | "reasoning"
  | "coding"
  | "review"
  | "creative"
  | "fast"
  | "local";

export type ZetroRoutingRule = {
  taskType: ZetroTaskType;
  primaryProvider:
    | "ollama-local"
    | "openai"
    | "anthropic"
    | "custom-openai-compatible"
    | "none";
  primaryModel?: string;
  fallbackProvider:
    | "ollama-local"
    | "openai"
    | "anthropic"
    | "custom-openai-compatible"
    | "none";
  fallbackModel?: string;
  maxCostPer1kTokens?: number;
  keywords: string[];
};

export type ZetroTaskRoutingConfig = {
  enabled: boolean;
  defaultTaskType: ZetroTaskType;
  rules: ZetroRoutingRule[];
  costTracking: {
    enabled: boolean;
    budgetPerDay?: number;
    warnAtPercent?: number;
  };
  taskRoutingConfig?: Record<string, unknown>;
};

export type ZetroTaskClassification = {
  taskType: ZetroTaskType;
  confidence: number;
  reasoning: string;
  matchedKeywords: string[];
};

export type ZetroRoutingDecision = {
  taskType: ZetroTaskType;
  provider:
    | "ollama-local"
    | "openai"
    | "anthropic"
    | "custom-openai-compatible"
    | "none";
  model: string | undefined;
  isFallback: boolean;
  estimatedCostPer1kTokens?: number;
};

export const ZETRO_TASK_TYPE_SUMMARY: Record<ZetroTaskType, string> = {
  reasoning: "Deep analysis, planning, architecture decisions",
  coding: "Code generation, refactoring, implementation",
  review: "Code review, security scan, bug finding",
  creative: "Documentation, explanations, writing",
  fast: "Simple queries, quick fixes, one-liners",
  local: "Local processing, offline work",
};

export const DEFAULT_ROUTING_RULES: ZetroRoutingRule[] = [
  {
    taskType: "reasoning",
    primaryProvider: "anthropic",
    primaryModel: "claude-3-5-sonnet-latest",
    fallbackProvider: "openai",
    fallbackModel: "gpt-4o",
    maxCostPer1kTokens: 0.015,
    keywords: [
      "analyze",
      "design",
      "plan",
      "architecture",
      "strategy",
      "evaluate",
      "assess",
      "review architecture",
      "decompose",
      "think through",
    ],
  },
  {
    taskType: "coding",
    primaryProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "anthropic",
    fallbackModel: "claude-3-5-sonnet-latest",
    maxCostPer1kTokens: 0.015,
    keywords: [
      "write code",
      "implement",
      "create function",
      "refactor",
      "add feature",
      "build component",
      "generate",
      "modify",
      "update code",
      "fix bug",
    ],
  },
  {
    taskType: "review",
    primaryProvider: "anthropic",
    primaryModel: "claude-3-5-sonnet-latest",
    fallbackProvider: "openai",
    fallbackModel: "gpt-4o",
    maxCostPer1kTokens: 0.015,
    keywords: [
      "review",
      "security scan",
      "audit",
      "check for bugs",
      "vulnerability",
      "lint",
      "examine code",
      "find issues",
      "assess quality",
    ],
  },
  {
    taskType: "creative",
    primaryProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "anthropic",
    fallbackModel: "claude-3-5-sonnet-latest",
    maxCostPer1kTokens: 0.015,
    keywords: [
      "write documentation",
      "explain",
      "describe",
      "tutorial",
      "guide",
      "write README",
      "create docs",
      "summarize",
    ],
  },
  {
    taskType: "fast",
    primaryProvider: "ollama-local",
    primaryModel: "llama3.2",
    fallbackProvider: "ollama-local",
    fallbackModel: "llama3.2",
    maxCostPer1kTokens: 0,
    keywords: [
      "quick fix",
      "simple",
      "one liner",
      "what is",
      "how to",
      "show me",
      "list",
      "get",
    ],
  },
  {
    taskType: "local",
    primaryProvider: "ollama-local",
    fallbackProvider: "ollama-local",
    maxCostPer1kTokens: 0,
    keywords: ["offline", "local only", "no network"],
  },
];

export const DEFAULT_TASK_ROUTING_CONFIG: ZetroTaskRoutingConfig = {
  enabled: true,
  defaultTaskType: "coding",
  rules: DEFAULT_ROUTING_RULES,
  costTracking: {
    enabled: true,
    budgetPerDay: 10,
    warnAtPercent: 80,
  },
};
