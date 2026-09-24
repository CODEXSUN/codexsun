import assert from "node:assert/strict";
import test from "node:test";
import { CodeitzSkillsProvider } from "../provider.js";
import { SkillRepository } from "../repository/skill.repository.js";
import { SkillDistillerService } from "../service/skill-distiller.service.js";

test("CodeitzSkillsProvider declares manifest and event contracts", () => {
  const provider = new CodeitzSkillsProvider();
  assert.equal(provider.manifest.id, "codeitz.skills");
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/skills");
  assert.ok(provider.manifest.events.published.includes("codeitz.skills.skill_registered"));
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
