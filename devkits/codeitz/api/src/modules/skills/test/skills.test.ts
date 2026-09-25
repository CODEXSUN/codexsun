import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CodeitzSkillsProvider } from "../provider.js";
import { SkillRepository } from "../repository/skill.repository.js";
import { SkillDistillerService } from "../service/skill-distiller.service.js";
import { SkillOrganiserService } from "../service/skill-organiser.service.js";
import { SkillReaderService } from "../service/skill-reader.service.js";

test("CodeitzSkillsProvider declares manifest and event contracts", () => {
  const provider = new CodeitzSkillsProvider();
  assert.equal(provider.manifest.id, "codeitz.skills");
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/skills");
  assert.ok(provider.manifest.events.published.includes("codeitz.skills.skill_registered"));
  assert.ok(provider.manifest.events.published.includes("codeitz.skills.skill_organized"));
  assert.ok(provider.manifest.events.consumed.includes("codeitz.learning.heuristic_synthesized"));
});

test("SkillDistillerService manages skills and distills valid SKILL.md markdown", () => {
  const repo = new SkillRepository();
  const service = new SkillDistillerService(repo);

  const baseline = service.listSkills();
  assert.ok(baseline.length >= 1);
  assert.equal(baseline[0].name, "agentic-swe-pipeline");

  // Distill a new skill
  const distilled = service.distillSkill({
    name: "react-boundary-migration",
    description: "Safely migrate legacy React component layouts to use boundary primitives.",
    domain: "frontend-architecture",
    problemSummary: "Component layout failures when upgrading to React 19.",
    verifiedSteps: [
      "Analyze JSX tree for unhandled promise suspense boundaries.",
      "Replace legacy context consumers with use() hook or modern providers.",
      "Verify TypeScript strict null checks and JSX transform output.",
    ],
    verificationChecks: [
      "Run vite build --mode development.",
      "Run react component unit test suite.",
    ],
    guardrails: ["Do not mutate existing props interfaces without backwards compatibility."],
    exclusions: ["Do not alter server-rendered entry points."],
  });

  assert.equal(distilled.name, "react-boundary-migration");
  assert.ok(distilled.markdown.startsWith("---\nname: react-boundary-migration"));
  assert.ok(distilled.markdown.includes("# React Boundary Migration"));
  assert.ok(distilled.markdown.includes("## Purpose"));
  assert.ok(distilled.markdown.includes("## Workflow"));
  assert.ok(distilled.markdown.includes("## Verification"));
  assert.ok(distilled.markdown.includes("## Exclusions"));

  const retrieved = service.getSkillByName("react-boundary-migration");
  assert.ok(retrieved);
  assert.equal(retrieved.id, distilled.id);
});

test("SkillReaderService discovers and parses workspace SKILL.md files", () => {
  const reader = new SkillReaderService();
  const skillFiles = reader.discoverSkillFiles([".agents/skills"]);
  assert.ok(skillFiles.length >= 1);
  assert.ok(skillFiles.some((f) => f.includes("agentic-swe-pipeline")));

  const sweSkillPath = skillFiles.find((f) => f.includes("agentic-swe-pipeline"))!;
  const parsed = reader.parseSkillFile(sweSkillPath);

  assert.equal(parsed.name, "agentic-swe-pipeline");
  assert.equal(parsed.valid, true);
  assert.ok(parsed.workflow.length > 0);
  assert.ok(parsed.verificationCriteria.length > 0);
  assert.ok(parsed.tags.includes("swe"));
});

test("SkillOrganiserService manages SQLite index, JSON catalog, and recommendations", () => {
  const testJson = resolve("storage/runtime/test-skills-catalog.json");
  const organiser = new SkillOrganiserService({
    jsonCatalogPath: testJson,
    inMemorySqlite: true,
  });

  const catalog = organiser.exportJsonCatalog();
  assert.ok(catalog.totalCount >= 1);
  assert.ok(existsSync(testJson));

  // Recommendation engine
  const recs = organiser.recommendSkills("We need an agentic swe pipeline to run verification checks and git diffs");
  assert.ok(recs.length >= 1);
  assert.ok(recs.some((r) => r.skill.name === "agentic-swe-pipeline"));
  assert.ok(recs[0].score > 0);
  assert.ok(recs[0].matchedKeywords.length > 0);

  // Organize skill metadata
  const organized = organiser.organizeSkill({
    name: "agentic-swe-pipeline",
    category: "swe",
    rating: 10,
    tags: ["pipeline", "autonomous", "verified"],
  });
  assert.equal(organized.category, "swe");
  assert.equal(organized.rating, 10);
  assert.ok(organized.tags.includes("autonomous"));

  // Filter skills by category
  const sweSkills = organiser.listSkills("swe");
  assert.ok(sweSkills.some((s) => s.name === "agentic-swe-pipeline"));

  // Cleanup
  organiser.close();
  rmSync(testJson, { force: true });
});
