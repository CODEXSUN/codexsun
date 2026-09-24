import { randomUUID } from "node:crypto";
import {
  type EngineeringExperience,
  type QueryHeuristicsInput,
  type RecordExperienceInput,
  type SynthesizedHeuristic,
} from "../contracts/learning-contracts.js";
import { ExperienceRepository } from "../repository/experience.repository.js";

export class SelfLearningService {
  constructor(private readonly repository: ExperienceRepository = new ExperienceRepository()) {
    this.seedBaselineHeuristics();
  }

  private seedBaselineHeuristics(): void {
    const baselines: Array<Omit<SynthesizedHeuristic, "id" | "createdAt" | "updatedAt">> = [
      {
        category: "guardrail",
        rule: "Always verify root directory before running commands and never execute commands in another checkout.",
        triggerKeywords: ["git", "command", "checkout", "directory", "root"],
        reinforcementCount: 5,
        effectivenessScore: 0.98,
      },
      {
        category: "guardrail",
        rule: "Every repository-owned Markdown document must begin with a single # Title heading as its first non-blank line.",
        triggerKeywords: ["markdown", "doc", "readme", "title", "heading"],
        reinforcementCount: 4,
        effectivenessScore: 0.95,
      },
      {
        category: "strategy",
        rule: "Inspect existing code evidence and public package contracts before proposing modifications.",
        triggerKeywords: ["refactor", "modify", "contract", "import", "package"],
        reinforcementCount: 3,
        effectivenessScore: 0.92,
      },
      {
        category: "anti-pattern",
        rule: "Do not import private application paths across apps; use shared package exports instead.",
        triggerKeywords: ["import", "module", "boundary", "dependency"],
        reinforcementCount: 4,
        effectivenessScore: 0.96,
      },
    ];

    const now = new Date().toISOString();
    for (const b of baselines) {
      this.repository.saveHeuristic({
        id: randomUUID(),
        ...b,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  recordExperience(input: RecordExperienceInput): {
    experience: EngineeringExperience;
    synthesized: SynthesizedHeuristic[];
  } {
    const now = new Date().toISOString();
    const experienceId = randomUUID();

    const heuristicsLearned = input.heuristicsLearned ?? [];
    if (input.rootCause && input.resolution) {
      heuristicsLearned.push(`Root cause: ${input.rootCause} -> Resolved by: ${input.resolution}`);
    }

    const exp: EngineeringExperience = {
      id: experienceId,
      taskId: input.taskId,
      outcome: input.outcome,
      domain: input.domain,
      symptoms: input.symptoms ?? [],
      rootCause: input.rootCause ?? "",
      resolution: input.resolution ?? "",
      heuristicsLearned,
      confidence: input.outcome === "success" ? 0.95 : 0.8,
      createdAt: now,
    };
    this.repository.saveExperience(exp);

    // Synthesize new heuristics if actionable resolution or learning is provided
    const synthesized: SynthesizedHeuristic[] = [];
    if (input.resolution && input.domain) {
      const keywords = Array.from(
        new Set([
          input.domain.toLowerCase(),
          ...(input.symptoms ?? []).map((s) => s.toLowerCase().split(/\s+/u)).flat(),
          ...input.resolution.toLowerCase().split(/\s+/u),
        ]),
      ).filter((w) => w.length > 3);

      const category = input.outcome === "failure" ? "anti-pattern" : "strategy";
      const rule =
        input.outcome === "failure"
          ? `Avoid failure pattern in ${input.domain}: ${input.rootCause || "unverified change"}. Fix: ${input.resolution}`
          : `Effective strategy in ${input.domain}: ${input.resolution}`;

      const heuristic: SynthesizedHeuristic = {
        id: randomUUID(),
        category,
        rule,
        triggerKeywords: keywords.slice(0, 10),
        reinforcementCount: 1,
        effectivenessScore: input.outcome === "success" ? 0.85 : 0.75,
        createdAt: now,
        updatedAt: now,
      };
      this.repository.saveHeuristic(heuristic);
      synthesized.push(heuristic);
    }

    return { experience: exp, synthesized };
  }

  queryRelevantHeuristics(input: QueryHeuristicsInput): SynthesizedHeuristic[] {
    const promptWords = input.prompt.toLowerCase().split(/[\s,.;:!?()_/-]+/u);
    const domainWord = input.domain?.toLowerCase();
    const all = this.repository.listHeuristics();

    const scored = all.map((h) => {
      let score = h.effectivenessScore;
      let matchedKeywords = 0;

      for (const kw of h.triggerKeywords) {
        if (promptWords.includes(kw) || kw === domainWord) {
          matchedKeywords += 1;
        }
      }

      if (matchedKeywords > 0) {
        score += matchedKeywords * 0.15;
      }

      return { heuristic: h, score, matchedKeywords };
    });

    return scored
      .filter((item) => item.matchedKeywords > 0 || item.score >= 0.9)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.heuristic);
  }

  reinforceHeuristic(id: string, wasEffective: boolean): SynthesizedHeuristic {
    const h = this.repository.findHeuristicById(id);
    if (!h) {
      throw new Error(`Heuristic ${id} not found.`);
    }

    h.reinforcementCount += 1;
    if (wasEffective) {
      h.effectivenessScore = Math.min(1.0, h.effectivenessScore + 0.05);
    } else {
      h.effectivenessScore = Math.max(0.1, h.effectivenessScore - 0.1);
    }
    h.updatedAt = new Date().toISOString();
    return this.repository.saveHeuristic(h);
  }

  listExperiences(): EngineeringExperience[] {
    return this.repository.listExperiences();
  }

  listHeuristics(): SynthesizedHeuristic[] {
    return this.repository.listHeuristics();
  }
}
