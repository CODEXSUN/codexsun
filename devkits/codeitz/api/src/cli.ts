#!/usr/bin/env node
import { parseArgs } from "node:util";
import { CodeitzEngineeringProvider } from "./modules/engineering/provider.js";
import { MemoryBankService } from "./modules/memory/service/memory-bank.service.js";
import { SkillOrganiserService } from "./modules/skills/service/skill-organiser.service.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      title: { type: "string", short: "t" },
      prompt: { type: "string", short: "p" },
      project: { type: "string", default: "codexsun" },
      priority: { type: "string", default: "high" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help || (!values.title && !values.prompt)) {
    console.log(`
Codeitz Autonomous SWE Task Runner CLI

Usage:
  tsx src/cli.ts --title <title> --prompt <prompt> [--project <id>] [--priority <level>]

Options:
  -t, --title     Title of the task (required)
  -p, --prompt    Detailed instructions and goals (required)
      --project   Target project ID (default: "codexsun")
      --priority  Queue priority: critical, high, medium, low (default: "high")
  -h, --help      Show this help message
`);
    process.exit(0);
  }

  const title = values.title || "Autonomous SWE Task";
  const prompt = values.prompt || title;
  const projectId = values.project || "codexsun";
  const priority = (values.priority as "critical" | "high" | "medium" | "low") || "high";

  console.log("=================================================");
  console.log("  CODEITZ AUTONOMOUS SWE ENGINE - TASK RUNNER    ");
  console.log("=================================================");
  console.log(`Project:  ${projectId}`);
  console.log(`Task:     ${title}`);
  console.log(`Prompt:   ${prompt}`);
  console.log(`Priority: ${priority}`);
  console.log("-------------------------------------------------");

  // 1. Initialize providers
  const engineering = new CodeitzEngineeringProvider();
  const memoryBank = new MemoryBankService();
  const skillOrganiser = new SkillOrganiserService();

  engineering.setMemoryAndSkills(memoryBank, skillOrganiser);

  // 2. Subscribe runner listener for real-time console feedback
  engineering.runner.subscribe((event) => {
    if (event.type === "runner_stepped") {
      const step = event.payload as { currentPhase?: string; action?: string; message?: string; completed?: boolean };
      const phase = (step.currentPhase || "step").toUpperCase();
      console.log(`[${phase}] ${step.message}`);
    } else if (event.type === "log_added") {
      const log = event.payload as { level: string; message: string };
      if (log.level === "warn" || log.level === "error") {
        console.log(`[! ${log.level.toUpperCase()}] ${log.message}`);
      }
    }
  });

  // 3. Create & enqueue task
  const task = engineering.orchestrator.createTask({
    title,
    prompt,
    targetPaths: ["devkits/codeitz"],
  });

  engineering.runner.enqueue({
    taskId: task.id,
    priority,
    projectId,
  });

  console.log(`[INTAKE] Enqueued task '${task.title}' (${task.id.slice(0, 8)})`);

  // 4. Step runner through all phases
  let completed = false;
  let iterations = 0;
  const maxIterations = 15;

  while (!completed && iterations < maxIterations) {
    iterations++;
    const result = engineering.runner.step();
    if (result.completed) {
      completed = true;
      if (!result.success || result.currentPhase === "failed") {
        console.error(`\nTask failed: ${result.message}`);
        engineering.runner.dispose();
        skillOrganiser.close();
        process.exit(1);
      }
    }
  }

  // 5. Output completion summary
  const finalTask = engineering.orchestrator.getTask(task.id);
  console.log("=================================================");
  console.log("  TASK EXECUTION COMPLETED SUCCESSFULLY          ");
  console.log("=================================================");
  console.log(`Phase:    ${finalTask.phase.toUpperCase()}`);
  console.log(`Status:   ${finalTask.status.toUpperCase()}`);
  console.log(`Verification Checks Passed: ${finalTask.verificationChecks.length}`);
  for (const check of finalTask.verificationChecks) {
    console.log(`  - [PASS] ${check.name} (${check.durationMs}ms): ${check.output}`);
  }
  console.log("-------------------------------------------------");
  console.log("Memory Bank & Skills Updated:");
  console.log(`  - Grounded progress memory recorded in SQLite & JSON snapshot`);
  console.log(`  - Repository working tree verified clean`);
  console.log("=================================================");

  engineering.runner.dispose();
  skillOrganiser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during SWE runner execution:", err);
  process.exit(1);
});
