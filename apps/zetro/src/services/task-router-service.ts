import type { Kysely } from "kysely";

import type {
  ZetroRoutingDecision,
  ZetroRoutingRule,
  ZetroTaskClassification,
  ZetroTaskRoutingConfig,
  ZetroTaskType,
} from "./task-router-types.js";
import {
  DEFAULT_ROUTING_RULES,
  DEFAULT_TASK_ROUTING_CONFIG,
} from "./task-router-types.js";
import { readZetroSettings } from "./settings-service.js";

export function classifyTask(
  input: string,
  config?: ZetroTaskRoutingConfig,
): ZetroTaskClassification {
  const rules = config?.rules ?? DEFAULT_ROUTING_RULES;
  const defaultType = config?.defaultTaskType ?? "coding";

  const lowerInput = input.toLowerCase();
  const taskScores: Map<ZetroTaskType, number> = new Map();
  const matchedKeywords: Map<ZetroTaskType, string[]> = new Map();

  for (const rule of rules) {
    let score = 0;
    const matches: string[] = [];

    for (const keyword of rule.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerInput.includes(lowerKeyword)) {
        score += 1;
        matches.push(keyword);
      }
    }

    if (score > 0) {
      taskScores.set(rule.taskType, score);
      matchedKeywords.set(rule.taskType, matches);
    }
  }

  if (taskScores.size === 0) {
    return {
      taskType: defaultType,
      confidence: 0.5,
      reasoning: "No keywords matched, using default task type",
      matchedKeywords: [],
    };
  }

  let bestType: ZetroTaskType = defaultType;
  let bestScore = 0;

  for (const [taskType, score] of taskScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestType = taskType;
    }
  }

  const maxPossibleScore = Math.max(...rules.map((r) => r.keywords.length));
  const confidence = Math.min(bestScore / maxPossibleScore + 0.3, 1);

  return {
    taskType: bestType,
    confidence,
    reasoning: `Matched ${bestScore} keywords for ${bestType}`,
    matchedKeywords: matchedKeywords.get(bestType) ?? [],
  };
}

export function routeToModel(
  taskType: ZetroTaskType,
  config?: ZetroTaskRoutingConfig,
  forceFallback = false,
): ZetroRoutingDecision {
  const rules = config?.rules ?? DEFAULT_ROUTING_RULES;
  const rule = rules.find((r) => r.taskType === taskType);

  if (!rule) {
    return {
      taskType,
      provider: "none",
      model: undefined,
      isFallback: false,
      estimatedCostPer1kTokens: 0,
    };
  }

  const provider = forceFallback ? rule.fallbackProvider : rule.primaryProvider;
  const model = forceFallback ? rule.fallbackModel : rule.primaryModel;

  return {
    taskType,
    provider,
    model,
    isFallback: forceFallback,
    estimatedCostPer1kTokens: rule.maxCostPer1kTokens,
  };
}

export function getFallbackModel(
  taskType: ZetroTaskType,
  config?: ZetroTaskRoutingConfig,
): ZetroRoutingDecision {
  return routeToModel(taskType, config, true);
}

export async function getRoutingConfig(
  _database: Kysely<unknown>,
): Promise<ZetroTaskRoutingConfig> {
  try {
    const settings = (await readZetroSettings(_database)) as Record<
      string,
      unknown
    >;
    if (settings?.taskRoutingConfig) {
      return settings.taskRoutingConfig as ZetroTaskRoutingConfig;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_TASK_ROUTING_CONFIG;
}

export async function updateRoutingConfig(
  _database: Kysely<unknown>,
  config: Partial<ZetroTaskRoutingConfig>,
): Promise<ZetroTaskRoutingConfig> {
  const currentConfig = DEFAULT_TASK_ROUTING_CONFIG;
  const newConfig: ZetroTaskRoutingConfig = {
    ...currentConfig,
    ...config,
    costTracking: {
      ...currentConfig.costTracking,
      ...(config.costTracking ?? {}),
    },
  };

  return newConfig;
}

export type ZetroCostRecord = {
  date: string;
  taskType: ZetroTaskType;
  provider: string;
  tokens: number;
  cost: number;
};

export class ZetroTaskRouter {
  private config: ZetroTaskRoutingConfig;
  private costLog: ZetroCostRecord[] = [];

  constructor(config?: ZetroTaskRoutingConfig) {
    this.config = config ?? DEFAULT_TASK_ROUTING_CONFIG;
  }

  getConfig(): ZetroTaskRoutingConfig {
    return this.config;
  }

  setConfig(config: ZetroTaskRoutingConfig): void {
    this.config = config;
  }

  classify(input: string): ZetroTaskClassification {
    return classifyTask(input, this.config);
  }

  route(input: string, forceFallback = false): ZetroRoutingDecision {
    const classification = this.classify(input);
    return routeToModel(classification.taskType, this.config, forceFallback);
  }

  routeByType(
    taskType: ZetroTaskType,
    forceFallback = false,
  ): ZetroRoutingDecision {
    return routeToModel(taskType, this.config, forceFallback);
  }

  getFallback(taskType: ZetroTaskType): ZetroRoutingDecision {
    return getFallbackModel(taskType, this.config);
  }

  getRuleForTaskType(taskType: ZetroTaskType): ZetroRoutingRule | undefined {
    return this.config.rules.find((r) => r.taskType === taskType);
  }

  logCost(record: ZetroCostRecord): void {
    if (this.config.costTracking.enabled) {
      this.costLog.push(record);
    }
  }

  getCostLog(): ZetroCostRecord[] {
    return [...this.costLog];
  }

  getTodayCost(): number {
    const today = new Date().toISOString().split("T")[0];
    return this.costLog
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  getCostByTaskType(): Record<ZetroTaskType, number> {
    const costs: Record<ZetroTaskType, number> = {
      reasoning: 0,
      coding: 0,
      review: 0,
      creative: 0,
      fast: 0,
      local: 0,
    };

    for (const record of this.costLog) {
      costs[record.taskType] += record.cost;
    }

    return costs;
  }

  shouldWarnBudget(): boolean {
    if (!this.config.costTracking.enabled) return false;
    if (!this.config.costTracking.budgetPerDay) return false;

    const todayCost = this.getTodayCost();
    const budget = this.config.costTracking.budgetPerDay;
    const warnAt = this.config.costTracking.warnAtPercent ?? 80;

    return (todayCost / budget) * 100 >= warnAt;
  }
}

export function createTaskRouter(
  config?: ZetroTaskRoutingConfig,
): ZetroTaskRouter {
  return new ZetroTaskRouter(config);
}
