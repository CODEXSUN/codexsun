import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { CodeitzLearningProvider } from "../provider.js";
import { ExperienceRepository } from "../repository/experience.repository.js";
import { SelfLearningService } from "../service/self-learning.service.js";

test("CodeitzLearningProvider declares manifest and event contracts", () => {
  const provider = new CodeitzLearningProvider();
  assert.equal(provider.manifest.id, "codeitz.learning");
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/learning");
  assert.ok(provider.manifest.events.published.includes("codeitz.learning.experience_indexed"));
  assert.ok(provider.manifest.events.consumed.includes("codeitz.swe.verified"));
});

test("SelfLearningService records experiences, synthesizes heuristics, and matches queries", () => {
  const repo = new ExperienceRepository();
  const service = new SelfLearningService(repo);

  // 1. Check baseline seeded heuristics
  const initial = service.listHeuristics();
  assert.ok(initial.length >= 4);

  // 2. Record a failure experience with root cause and fix
  const taskId = randomUUID();
  const { experience, synthesized } = service.recordExperience({
    taskId,
    outcome: "failure",
    domain: "database-migration",
    symptoms: ["Table already exists error", "Rollback failed"],
    rootCause: "Migration script did not use IF NOT EXISTS guard",
    resolution: "Wrap DDL statements with IF NOT EXISTS and idempotency checks",
  });

  assert.equal(experience.outcome, "failure");
  assert.equal(synthesized.length, 1);
  assert.equal(synthesized[0].category, "anti-pattern");
  assert.ok(synthesized[0].rule.includes("IF NOT EXISTS"));

  // 3. Query relevant heuristics for a new task mentioning migrations
  const matched = service.queryRelevantHeuristics({
    prompt: "Write a new database migration for customer orders table",
    domain: "database-migration",
  });
  assert.ok(matched.length > 0);
  assert.ok(matched.some((h) => h.rule.includes("IF NOT EXISTS")));

  // 4. Reinforce heuristic
  const heuristicId = synthesized[0].id;
  const initialScore = synthesized[0].effectivenessScore;
  const reinforced = service.reinforceHeuristic(heuristicId, true);
  assert.ok(reinforced.effectivenessScore > initialScore);
  assert.equal(reinforced.reinforcementCount, 2);
});
