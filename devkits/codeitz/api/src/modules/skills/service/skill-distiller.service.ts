import { randomUUID } from "node:crypto";
import {
  type SkillDefinition,
  type SkillDistillationRequest,
} from "../contracts/skills-contracts.js";
import { SkillRepository } from "../repository/skill.repository.js";

export class SkillDistillerService {
  constructor(private readonly repository: SkillRepository = new SkillRepository()) {
    this.seedBaselineSkills();
  }

  private seedBaselineSkills(): void {
    const sweLoop = this.distillSkill({
      name: "agentic-swe-pipeline",
      description: "Autonomous software engineering loop: requirement decomposition, ground-truth code exploration, minimal safe diffing, verification, and regression prevention.",
      domain: "software-engineering",
      problemSummary: "Disciplined execution of software changes without regressions or uncontrolled modifications.",
      verifiedSteps: [
        "Restate outcome, constraints, and target files before proposing code edits.",
        "Inspect relevant repository source code and unit tests read-only.",
        "Draft minimal viable diff targeting only owned boundaries.",
        "Execute automated typecheck, lint, and unit test suites.",
        "Conduct post-verification acceptance review against original requirements.",
      ],
      verificationChecks: [
        "Verify command was run from repository root.",
        "Verify all affected test suites exit code 0.",
        "Verify no foreign workspace directories were touched.",
      ],
      guardrails: [
        "Preserve existing comments and docstrings.",
        "Use public package exports instead of private app imports.",
      ],
      exclusions: [
        "Do not touch secrets, production databases, or external checkouts.",
      ],
    });
    this.repository.save(sweLoop);
  }

  distillSkill(request: SkillDistillationRequest): SkillDefinition {
    const title = request.name
      .split("-")
      .map((w) => `${w[0].toUpperCase()}${w.slice(1)}`)
      .join(" ");

    const markdown = [
      "---",
      `name: ${request.name}`,
      `description: ${request.description}`,
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      request.description,
      "",
      "## Scope",
      "",
      `Applies to ${request.domain} tasks. Addresses: ${request.problemSummary}`,
      "",
      "## Inputs",
      "",
      "- Task prompt and goal",
      "- Target source files and tests",
      "- Applicable constraints and platform contracts",
      "",
      "## Workflow",
      "",
      ...request.verifiedSteps.map((step, idx) => `${idx + 1}. ${step}`),
      "",
      "## Verification",
      "",
      ...request.verificationChecks.map((check) => `- ${check}`),
      "",
      ...(request.guardrails.length > 0
        ? ["## Guardrails", "", ...request.guardrails.map((g) => `- ${g}`), ""]
        : []),
      "## Exclusions",
      "",
      ...(request.exclusions.length > 0
        ? request.exclusions.map((e) => `- ${e}`)
        : ["- Do not execute actions outside the approved workspace root."]),
      "",
    ].join("\n");

    const skill: SkillDefinition = {
      id: randomUUID(),
      name: request.name,
      description: request.description,
      scope: `Domain: ${request.domain}`,
      inputs: ["Task prompt", "Workspace files", "Test targets"],
      workflow: request.verifiedSteps,
      verificationCriteria: request.verificationChecks,
      exclusions: request.exclusions,
      markdown,
      synthesizedFromExperienceId: request.experienceId,
      createdAt: new Date().toISOString(),
    };

    return this.repository.save(skill);
  }

  getSkill(id: string): SkillDefinition | undefined {
    return this.repository.findById(id);
  }

  getSkillByName(name: string): SkillDefinition | undefined {
    return this.repository.findByName(name);
  }

  listSkills(): SkillDefinition[] {
    return this.repository.list();
  }
}
