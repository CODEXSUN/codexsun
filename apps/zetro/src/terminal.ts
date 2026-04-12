import { existsSync } from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

import { getServerConfig } from "../../framework/src/runtime/config/index.js";
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../framework/src/runtime/database/index.js";
import {
  appendZetroRunEvent,
  createZetroFinding,
  createZetroRun,
  createZetroCommandProposal,
  getZetroRunWithDetails,
  listZetroCommandProposals,
  listZetroFindings,
  updateZetroFindingStatus,
  updateZetroCommandProposalStatus,
  buildZetroModelSettings,
  checkProviderHealth,
  completeModelRequest,
  buildPromptFromMessages,
  createZetroChatSession,
  createZetroChatMessage,
  listZetroChatMessages,
  ZETRO_REVIEW_LANES,
  buildReviewSummary,
  getZetroLoopState,
  createZetroLoopState,
  startZetroLoop,
  cancelZetroLoop,
  completeZetroLoop,
  listZetroIterationEvents,
  DEFAULT_LOOP_CONFIGURATION,
  storeMemoryVector,
  searchMemory,
  findSimilarFindings,
  listMemoryVectors,
  getMemoryStats,
  validatePlaybookConditions,
  evaluatePhaseConditions,
  buildSmartPhaseContext,
  type ZetroCreateLoopConfigurationInput,
} from "./services/index.js";
import type {
  ZetroFindingStatus,
  ZetroCreateFindingInput,
  ZetroCreateRunEventInput,
  ZetroCreateRunInput,
  ZetroCreateCommandProposalInput,
  ZetroRunEventKind,
  ZetroModelMessage,
} from "./services/index.js";
import type {
  ZetroOutputModeId,
  ZetroPlaybookPhase,
  ZetroSmartPhaseContext,
} from "../shared/index.js";
import {
  loadZetroTerminalData,
  type ZetroTerminalData,
} from "./terminal-data.js";

type ZetroTerminalCommand =
  | "help"
  | "status"
  | "summary"
  | "playbooks"
  | "playbook"
  | "playbook-validate"
  | "playbook-evaluate"
  | "modes"
  | "guardrails"
  | "runs"
  | "run"
  | "create-run"
  | "add-event"
  | "output"
  | "proposals"
  | "propose"
  | "approve"
  | "reject"
  | "findings"
  | "create-finding"
  | "finding-status"
  | "review-lanes"
  | "review-summary"
  | "loop"
  | "loop-start"
  | "loop-stop"
  | "loop-cancel"
  | "loop-events"
  | "memory-search"
  | "memory-similar"
  | "memory-store"
  | "memory-list"
  | "memory-stats"
  | "plan"
  | "assist"
  | "doctor"
  | "chat";

function printHeader(title: string) {
  console.info("");
  console.info(`== ${title} ==`);
}

function printUsage() {
  printHeader("Zetro terminal");
  console.info("Usage: npm run zetro -- <command> [value]");
  console.info("");
  console.info("Commands:");
  console.info("  help                         Show this help.");
  console.info(
    "  status                       Show current lock, data source, and catalog counts.",
  );
  console.info(
    "  summary                      Show the current terminal-first catalog summary.",
  );
  console.info("  playbooks                    List playbooks.");
  console.info("  playbook <id>                Show one playbook with phases.");
  console.info("  playbook-validate <id>       Validate playbook conditions.");
  console.info(
    "  playbook-evaluate <id> --run <id>  Evaluate phase conditions for a run.",
  );
  console.info("  modes                        List output modes.");
  console.info("  guardrails                   List guardrail templates.");
  console.info("  runs                         List runs.");
  console.info(
    "  run <id>                     Show one run with timeline and findings.",
  );
  console.info(
    "  create-run --title <v> --playbook <id> --summary <v> [--id <id>]",
  );
  console.info("  add-event --run <id> --summary <v> [--kind note]");
  console.info("  output <runId>               Show run output sections.");
  console.info("  proposals [--run <id>]       List command proposals.");
  console.info(
    "  propose --run <id> --cmd <v> --summary <v> [--args <v>] [--rationale <v>]",
  );
  console.info("  approve <proposalId>          Approve a command proposal.");
  console.info("  reject <proposalId>          Reject a command proposal.");
  console.info("  findings                     List findings.");
  console.info(
    "  create-finding --title <v> --summary <v> [--run <id>] [--id <id>]",
  );
  console.info("  finding-status --finding <id> --status <status>");
  console.info("  review-lanes                  List all review lanes.");
  console.info(
    "  review-summary [--run <id>]  Show review summary from findings.",
  );
  console.info("  loop <runId>                  Show loop state for a run.");
  console.info(
    "  loop-start --run <id> [--max <n>] [--timeout <ms>]  Start a loop.",
  );
  console.info("  loop-stop --run <id>          Stop/complete a loop.");
  console.info("  loop-cancel --run <id>       Cancel a running loop.");
  console.info(
    "  loop-events --run <id>       Show iteration events for a run.",
  );
  console.info(
    "  memory-search <query>        Search memory for similar content.",
  );
  console.info(
    "  memory-similar --title <v> --summary <v>  Find similar past findings.",
  );
  console.info(
    "  memory-store --finding <id> --content <v>  Store finding in memory.",
  );
  console.info("  memory-list [--type <type>]   List memory vectors.");
  console.info("  memory-stats                 Show memory statistics.");
  console.info(
    "  plan <request>               Print a maximum-output plan scaffold.",
  );
  console.info(
    "  assist                       Show the Zetro Assist read order and runtime lock.",
  );
  console.info(
    "  doctor                       Validate terminal catalog and Assist files.",
  );
  console.info(
    "  chat [--provider=<id>] [--mode=<mode>]  Start an interactive shell.",
  );
  console.info(
    "                               Providers: none, ollama-local, openai, anthropic.",
  );
  console.info(
    "                               Modes: brief, normal, detailed, maximum, audit.",
  );
  console.info("");
  console.info(
    "Current runner mode: manual. Set ZETRO_PROVIDER to enable model chat.",
  );
}

function resolveCommand(
  value: string | undefined,
): ZetroTerminalCommand | null {
  switch (value) {
    case undefined:
    case "help":
      return "help";
    case "status":
    case "summary":
    case "playbooks":
    case "playbook":
    case "playbook-validate":
    case "playbook-evaluate":
    case "modes":
    case "guardrails":
    case "runs":
    case "run":
    case "create-run":
    case "add-event":
    case "output":
    case "proposals":
    case "propose":
    case "approve":
    case "reject":
    case "findings":
    case "create-finding":
    case "finding-status":
    case "review-lanes":
    case "review-summary":
    case "loop":
    case "loop-start":
    case "loop-stop":
    case "loop-cancel":
    case "loop-events":
    case "memory-search":
    case "memory-similar":
    case "memory-store":
    case "memory-list":
    case "memory-stats":
    case "plan":
    case "assist":
    case "doctor":
    case "chat":
      return value;
    default:
      return null;
  }
}

function readOption(args: string[], name: string) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function requireOption(args: string[], name: string) {
  const value = readOption(args, name)?.trim();

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

async function withZetroDatabase<T>(
  operation: (database: Parameters<typeof createZetroRun>[0]) => Promise<T>,
) {
  const databases = createRuntimeDatabases(getServerConfig(process.cwd()));

  try {
    await prepareApplicationDatabase(databases);
    return await operation(databases.primary);
  } finally {
    await databases.destroy();
  }
}

function printWriteError(error: unknown) {
  console.info(error instanceof Error ? error.message : "Zetro write failed.");
  process.exitCode = 1;
}

function printDataSource(data: ZetroTerminalData) {
  console.info(`Data source: ${data.source}`);

  if (data.fallbackReason) {
    console.info(`Fallback reason: ${data.fallbackReason}`);
  }
}

function printSummary(data: ZetroTerminalData) {
  printHeader("Summary");
  printDataSource(data);
  console.info(`Playbooks: ${data.summary.playbooks}`);
  console.info(`Active playbooks: ${data.summary.activePlaybooks}`);
  console.info(
    `Approval-gated playbooks: ${data.summary.approvalRequiredPlaybooks}`,
  );
  console.info(`Output modes: ${data.summary.outputModes}`);
  console.info(`Default output mode: ${data.summary.defaultOutputMode}`);
  console.info(`Guardrail templates: ${data.summary.guardrails}`);
  console.info(`Runs: ${data.summary.runs}`);
  console.info(`Active runs: ${data.summary.activeRuns}`);
  console.info(`Findings: ${data.summary.findings}`);
  console.info(`Open findings: ${data.summary.openFindings}`);
  console.info(`Runner mode: ${data.summary.runnerMode}`);
  console.info(`Execution: ${data.summary.commandExecution}`);
}

function getDuplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

function runDoctor(data: ZetroTerminalData) {
  printHeader("Doctor");

  printDataSource(data);

  const outputModeIds = new Set(data.outputModes.map((mode) => mode.id));
  const playbookIdDuplicates = getDuplicateValues(
    data.playbooks.map((playbook) => playbook.id),
  );
  const guardrailIdDuplicates = getDuplicateValues(
    data.guardrails.map((guardrail) => guardrail.id),
  );
  const missingOutputModes = data.playbooks
    .filter((playbook) => !outputModeIds.has(playbook.defaultOutputMode))
    .map((playbook) => `${playbook.id}:${playbook.defaultOutputMode}`);
  const emptyPhasePlaybooks = data.playbooks
    .filter((playbook) => playbook.phases.length === 0)
    .map((playbook) => playbook.id);
  const assistFiles = [
    "README.md",
    "BEHAVIOR.md",
    "MASTER_PLAN.md",
    "END_TO_END_CREATION.md",
    "WALKTHROUGH.md",
    "NEEDED_THINGS.md",
    "SOURCES.md",
    "OPERATING_MODEL.md",
    "QUALITY_GATES.md",
    "DECISIONS.md",
    "SYSTEM_PROMPT.md",
  ];
  const missingAssistFiles = assistFiles.filter(
    (fileName) => !existsSync(resolve("apps", "zetro", "ASSIST", fileName)),
  );
  const failures = [
    ...playbookIdDuplicates.map((id) => `Duplicate playbook id: ${id}`),
    ...guardrailIdDuplicates.map((id) => `Duplicate guardrail id: ${id}`),
    ...missingOutputModes.map(
      (entry) => `Unknown playbook output mode: ${entry}`,
    ),
    ...emptyPhasePlaybooks.map((id) => `Playbook has no phases: ${id}`),
    ...missingAssistFiles.map((fileName) => `Missing Assist file: ${fileName}`),
  ];

  if (failures.length === 0) {
    console.info("OK catalog ids are unique");
    console.info("OK playbook output modes are valid");
    console.info("OK playbooks have phases");
    console.info("OK Assist files are present");
    console.info("OK runner remains manual");
    return;
  }

  for (const failure of failures) {
    console.info(`FAIL ${failure}`);
  }

  process.exitCode = 1;
}

function printAssist(data: ZetroTerminalData) {
  printHeader("Assist");
  console.info("Read order:");
  console.info("1. apps/zetro/ASSIST/README.md");
  console.info("2. apps/zetro/ASSIST/BEHAVIOR.md");
  console.info("3. apps/zetro/ASSIST/MASTER_PLAN.md");
  console.info("4. apps/zetro/ASSIST/END_TO_END_CREATION.md");
  console.info("5. apps/zetro/ASSIST/WALKTHROUGH.md");
  console.info("6. apps/zetro/ASSIST/NEEDED_THINGS.md");
  console.info("7. apps/zetro/ASSIST/SOURCES.md");
  console.info("8. apps/zetro/ASSIST/OPERATING_MODEL.md");
  console.info("9. apps/zetro/ASSIST/QUALITY_GATES.md");
  console.info("10. apps/zetro/ASSIST/DECISIONS.md");
  console.info("11. apps/zetro/ASSIST/SYSTEM_PROMPT.md");
  console.info("");
  console.info("Current lock:");
  console.info(`- data source: ${data.source}`);
  console.info(`- runner: ${data.settings.runtimeLock.runnerMode}`);
  console.info(
    `- command execution: ${data.settings.runtimeLock.commandExecution}`,
  );
  console.info(`- LLM calls: ${data.settings.runtimeLock.llmCalls}`);
  console.info(`- network calls: ${data.settings.runtimeLock.networkCalls}`);
  console.info(
    `- autonomous loop: ${data.settings.runtimeLock.autonomousLoop}`,
  );
}

function printPlaybooks(data: ZetroTerminalData) {
  printHeader("Playbooks");
  printDataSource(data);
  for (const playbook of data.playbooks) {
    console.info(
      `${playbook.id} | ${playbook.name} | ${playbook.kind} | ${playbook.status} | ${playbook.defaultOutputMode}`,
    );
    console.info(`  ${playbook.summary}`);
  }
}

function printPhase(index: number, phase: ZetroPlaybookPhase) {
  console.info(
    `${index + 1}. ${phase.name}${phase.approvalGate ? " [approval gate]" : ""}`,
  );
  console.info(`   Objective: ${phase.objective}`);
  console.info(`   Output: ${phase.expectedOutput}`);
}

function printPlaybook(
  data: ZetroTerminalData,
  playbookId: string | undefined,
) {
  if (!playbookId) {
    console.info(
      "Missing playbook id. Try: npm run zetro -- playbook feature-dev",
    );
    process.exitCode = 1;
    return;
  }

  const playbook = data.playbooks.find((item) => item.id === playbookId);

  if (!playbook) {
    console.info(`Unknown playbook: ${playbookId}`);
    process.exitCode = 1;
    return;
  }

  printHeader(playbook.name);
  printDataSource(data);
  console.info(`ID: ${playbook.id}`);
  console.info(`Kind: ${playbook.kind}`);
  console.info(`Family: ${playbook.family}`);
  console.info(`Status: ${playbook.status}`);
  console.info(`Risk: ${playbook.riskLevel}`);
  console.info(`Output mode: ${playbook.defaultOutputMode}`);
  console.info(
    `Approval: ${playbook.requiresApproval ? "required" : "not required"}`,
  );
  console.info("");
  console.info(playbook.description);
  console.info("");
  console.info("Phases:");
  for (const [index, phase] of playbook.phases.entries()) {
    printPhase(index, phase);
  }
}

function validatePlaybookFromArgs(
  data: ZetroTerminalData,
  playbookId: string | undefined,
) {
  if (!playbookId) {
    console.info(
      "Missing playbook id. Try: npm run zetro -- playbook-validate feature-dev",
    );
    process.exitCode = 1;
    return;
  }

  const playbook = data.playbooks.find((item) => item.id === playbookId);

  if (!playbook) {
    console.info(`Unknown playbook: ${playbookId}`);
    process.exitCode = 1;
    return;
  }

  printHeader("Playbook validation");
  console.info(`Playbook: ${playbook.name}`);
  console.info(`Kind: ${playbook.kind}`);

  if (playbook.kind !== "smart") {
    console.info("Not a smart playbook. Validation not applicable.");
    return;
  }

  const result = validatePlaybookConditions(playbook.phases);

  if (result.valid) {
    console.info("Status: VALID");
    console.info("All conditions are correctly configured.");
  } else {
    console.info("Status: INVALID");
    console.info("");
    for (const error of result.errors) {
      console.info(`  - ${error}`);
    }
    process.exitCode = 1;
  }
}

async function evaluatePlaybookFromArgs(args: string[]) {
  const playbookId = args[0];
  const runId = readOption(args, "--run");

  if (!playbookId) {
    console.info(
      "Missing playbook id. Try: npm run zetro -- playbook-evaluate feature-dev --run <runId>",
    );
    process.exitCode = 1;
    return;
  }

  if (!runId) {
    console.info(
      "Missing --run. Try: npm run zetro -- playbook-evaluate feature-dev --run <runId>",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const data = await loadZetroTerminalData();
    const playbook = data.playbooks.find((item) => item.id === playbookId);

    if (!playbook) {
      console.info(`Unknown playbook: ${playbookId}`);
      process.exitCode = 1;
      return;
    }

    printHeader("Playbook evaluation");
    console.info(`Playbook: ${playbook.name}`);
    console.info(`Run: ${runId}`);
    console.info("");

    const context: ZetroSmartPhaseContext = await withZetroDatabase(
      (database) => buildSmartPhaseContext(database, runId, 1),
    );

    console.info("Context:");
    console.info(`  Findings: ${context.findings?.length ?? 0}`);
    console.info(`  Iteration: ${context.iteration}`);
    if (context.severityCounts) {
      console.info("  Severity counts:");
      for (const [severity, count] of Object.entries(context.severityCounts)) {
        console.info(`    ${severity}: ${count}`);
      }
    }
    console.info("");

    const evaluation = evaluatePhaseConditions(playbook.phases[0]!, context);

    console.info("Phase evaluation (first phase):");
    console.info(`  Phase: ${playbook.phases[0]!.name}`);
    console.info(`  Should execute: ${evaluation.shouldExecute}`);
    console.info(`  Should skip: ${evaluation.shouldSkip}`);
    console.info(`  Reason: ${evaluation.reason}`);

    if (evaluation.shouldGoto) {
      console.info(`  Goto: ${evaluation.shouldGoto}`);
    }

    if (evaluation.evaluatedConditions.length > 0) {
      console.info("");
      console.info("Evaluated conditions:");
      for (const cond of evaluation.evaluatedConditions) {
        console.info(
          `  ${cond.conditionId}: passed=${cond.passed}, actual=${cond.actual}, expected=${cond.expected}`,
        );
      }
    }
  } catch (error) {
    printWriteError(error);
  }
}

function printModes(data: ZetroTerminalData) {
  printHeader("Output modes");
  printDataSource(data);
  for (const mode of data.outputModes) {
    console.info(`${mode.id} | ${mode.name}`);
    console.info(`  ${mode.summary}`);
    console.info(`  Sections: ${mode.sections.join(", ")}`);
  }
}

function printGuardrails(data: ZetroTerminalData) {
  printHeader("Guardrails");
  printDataSource(data);
  for (const guardrail of data.guardrails) {
    console.info(
      `${guardrail.id} | ${guardrail.event} | ${guardrail.severity}`,
    );
    console.info(`  ${guardrail.summary}`);
  }
}

function printRuns(data: ZetroTerminalData) {
  printHeader("Runs");
  printDataSource(data);
  for (const run of data.runs) {
    console.info(`${run.id} | ${run.status} | ${run.outputMode}`);
    console.info(`  ${run.title}`);
    console.info(`  ${run.summary}`);
  }
}

async function printRun(runId: string | undefined) {
  if (!runId) {
    console.info(
      "Missing run id. Try: npm run zetro -- run run-static-catalog",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const run = await withZetroDatabase((database) =>
      getZetroRunWithDetails(database, runId),
    );

    if (!run) {
      console.info(`Unknown run: ${runId}`);
      process.exitCode = 1;
      return;
    }

    printHeader(run.title);
    console.info("Data source: database");
    console.info(`ID: ${run.id}`);
    console.info(`Playbook: ${run.playbookId}`);
    console.info(`Status: ${run.status}`);
    console.info(`Output mode: ${run.outputMode}`);
    console.info(`Summary: ${run.summary}`);
    console.info("");
    console.info("Events:");

    if (run.events.length === 0) {
      console.info("No events yet.");
    } else {
      for (const event of run.events) {
        console.info(`${event.sequence}. ${event.kind} | ${event.createdAt}`);
        console.info(`   ${event.summary}`);
        if (event.detail) {
          console.info(`   ${event.detail}`);
        }
      }
    }

    console.info("");
    console.info("Findings:");

    if (run.findings.length === 0) {
      console.info("No findings linked to this run.");
    } else {
      for (const finding of run.findings) {
        console.info(`${finding.id} | ${finding.severity} | ${finding.status}`);
        console.info(`   ${finding.title}`);
      }
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function printRunOutput(runId: string | undefined) {
  if (!runId) {
    console.info(
      "Missing run id. Try: npm run zetro -- output run-static-catalog",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const run = await withZetroDatabase((database) =>
      getZetroRunWithDetails(database, runId),
    );

    if (!run) {
      console.info(`Unknown run: ${runId}`);
      process.exitCode = 1;
      return;
    }

    printHeader("Run output");
    console.info(`Run: ${run.title}`);
    console.info(`Output mode: ${run.outputMode}`);
    console.info("");

    if (run.outputSections.length === 0) {
      console.info("No output sections yet.");
      return;
    }

    for (const section of run.outputSections) {
      console.info(`--- ${section.section} ---`);
      console.info(section.content);
      console.info("");
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function printProposals(args: string[]) {
  const runId = readOption(args, "--run");

  try {
    const proposals = await withZetroDatabase((database) =>
      listZetroCommandProposals(database, runId ? { runId } : undefined),
    );

    printHeader("Command proposals");
    console.info(`Data source: database`);
    console.info(`Total: ${proposals.length}`);

    if (proposals.length === 0) {
      console.info("No command proposals found.");
      return;
    }

    for (const proposal of proposals) {
      console.info("");
      console.info(`${proposal.id}`);
      console.info(`  Command: ${proposal.command} ${proposal.args.join(" ")}`);
      console.info(`  Summary: ${proposal.summary}`);
      if (proposal.rationale) {
        console.info(`  Rationale: ${proposal.rationale}`);
      }
      console.info(`  Status: ${proposal.status}`);
      if (proposal.reviewedAt) {
        console.info(
          `  Reviewed: ${new Date(proposal.reviewedAt).toLocaleString()}${
            proposal.reviewedBy ? ` by ${proposal.reviewedBy}` : ""
          }`,
        );
      }
      console.info(
        `  Created: ${new Date(proposal.createdAt).toLocaleString()}`,
      );
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function createProposalFromArgs(args: string[]) {
  const runId = requireOption(args, "--run");
  const command = requireOption(args, "--cmd");
  const summary = requireOption(args, "--summary");
  const argsValue = readOption(args, "--args");
  const rationale = readOption(args, "--rationale");

  try {
    const payload = {
      runId,
      command,
      args: argsValue ? argsValue.split(" ") : [],
      summary,
      rationale,
    } satisfies ZetroCreateCommandProposalInput;

    const proposal = await withZetroDatabase((database) =>
      createZetroCommandProposal(database, payload),
    );

    printHeader("Command proposal created");
    console.info(`${proposal.id}`);
    console.info(`Command: ${proposal.command} ${proposal.args.join(" ")}`);
    console.info(`Status: ${proposal.status}`);
  } catch (error) {
    printWriteError(error);
  }
}

async function approveProposal(proposalId: string | undefined) {
  if (!proposalId) {
    console.info(
      "Missing proposal id. Try: npm run zetro -- approve <proposalId>",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const proposal = await withZetroDatabase((database) =>
      updateZetroCommandProposalStatus(database, proposalId, {
        status: "approved",
        reviewedBy: "operator",
      }),
    );

    printHeader("Proposal approved");
    console.info(`${proposal.id}`);
    console.info(`Command: ${proposal.command}`);
    console.info(`Status: ${proposal.status}`);
  } catch (error) {
    printWriteError(error);
  }
}

async function rejectProposal(proposalId: string | undefined) {
  if (!proposalId) {
    console.info(
      "Missing proposal id. Try: npm run zetro -- reject <proposalId>",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const proposal = await withZetroDatabase((database) =>
      updateZetroCommandProposalStatus(database, proposalId, {
        status: "rejected",
        reviewedBy: "operator",
      }),
    );

    printHeader("Proposal rejected");
    console.info(`${proposal.id}`);
    console.info(`Command: ${proposal.command}`);
    console.info(`Status: ${proposal.status}`);
  } catch (error) {
    printWriteError(error);
  }
}

function printFindings(data: ZetroTerminalData) {
  printHeader("Findings");
  printDataSource(data);
  for (const finding of data.findings) {
    console.info(
      `${finding.id} | ${finding.severity} | ${finding.category} | ${finding.confidence}% | ${finding.status}`,
    );
    console.info(`  ${finding.title}`);
    console.info(`  ${finding.summary}`);
  }
}

function printReviewLanes() {
  printHeader("Review lanes");
  for (const lane of ZETRO_REVIEW_LANES) {
    console.info(`${lane.id} | ${lane.name} | ${lane.defaultSeverity}`);
    console.info(`  ${lane.description}`);
    console.info(`  Keywords: ${lane.keywords.join(", ")}`);
  }
}

async function printReviewSummary(args: string[]) {
  const runId = readOption(args, "--run");

  try {
    const findings = await withZetroDatabase((database) =>
      listZetroFindings(database, runId ? { runId } : undefined),
    );

    const findingsForSummary = findings.map((f) => ({
      laneId: (f.category as any) ?? "general",
      severity: f.severity as any,
      status: f.status as any,
    }));

    const summary = buildReviewSummary(
      findingsForSummary as Parameters<typeof buildReviewSummary>[0],
    );

    printHeader("Review summary");
    console.info(`Total: ${summary.total}`);
    console.info(
      `Open: ${summary.open} | Accepted: ${summary.accepted} | Dismissed: ${summary.dismissed} | Fixed: ${summary.fixed} | Deferred: ${summary.deferred}`,
    );
    console.info("");
    console.info("By lane:");
    for (const [laneId, count] of Object.entries(summary.byLane)) {
      console.info(`  ${laneId}: ${count}`);
    }
    console.info("");
    console.info("By severity:");
    for (const [severity, count] of Object.entries(summary.bySeverity)) {
      console.info(`  ${severity}: ${count}`);
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function createRunFromArgs(args: string[]) {
  try {
    const payload = {
      id: readOption(args, "--id"),
      title: requireOption(args, "--title"),
      playbookId: requireOption(args, "--playbook"),
      summary: requireOption(args, "--summary"),
      status: readOption(args, "--status") as
        | ZetroCreateRunInput["status"]
        | undefined,
      outputMode: readOption(args, "--output") as
        | ZetroCreateRunInput["outputMode"]
        | undefined,
    } satisfies ZetroCreateRunInput;
    const run = await withZetroDatabase((database) =>
      createZetroRun(database, payload),
    );

    printHeader("Run created");
    console.info(`${run.id} | ${run.status} | ${run.outputMode}`);
    console.info(run.title);
  } catch (error) {
    printWriteError(error);
  }
}

async function addEventFromArgs(args: string[]) {
  try {
    const runId = requireOption(args, "--run");
    const payload = {
      id: readOption(args, "--id"),
      kind: readOption(args, "--kind") as ZetroRunEventKind | undefined,
      summary: requireOption(args, "--summary"),
      detail: readOption(args, "--detail"),
    } satisfies ZetroCreateRunEventInput;
    const event = await withZetroDatabase((database) =>
      appendZetroRunEvent(database, runId, payload),
    );

    printHeader("Run event added");
    console.info(`${event.runId} | ${event.sequence} | ${event.kind}`);
    console.info(event.summary);
  } catch (error) {
    printWriteError(error);
  }
}

async function createFindingFromArgs(args: string[]) {
  try {
    const payload = {
      id: readOption(args, "--id"),
      title: requireOption(args, "--title"),
      category: (readOption(args, "--category") ??
        "architecture") as ZetroCreateFindingInput["category"],
      severity: (readOption(args, "--severity") ??
        "medium") as ZetroCreateFindingInput["severity"],
      confidence: Number(readOption(args, "--confidence") ?? "90"),
      status: (readOption(args, "--status") ?? "open") as ZetroFindingStatus,
      summary: requireOption(args, "--summary"),
      runId: readOption(args, "--run"),
    } satisfies ZetroCreateFindingInput;
    const finding = await withZetroDatabase((database) =>
      createZetroFinding(database, payload),
    );

    printHeader("Finding created");
    console.info(`${finding.id} | ${finding.severity} | ${finding.status}`);
    console.info(finding.title);
  } catch (error) {
    printWriteError(error);
  }
}

async function updateFindingStatusFromArgs(args: string[]) {
  try {
    const findingId = requireOption(args, "--finding");
    const status = requireOption(args, "--status") as ZetroFindingStatus;
    const finding = await withZetroDatabase((database) =>
      updateZetroFindingStatus(database, findingId, status),
    );

    printHeader("Finding status updated");
    console.info(`${finding.id} | ${finding.status}`);
    console.info(finding.title);
  } catch (error) {
    printWriteError(error);
  }
}

async function printLoopState(runId: string | undefined) {
  if (!runId) {
    console.info("Missing run id. Try: npm run zetro -- loop <runId>");
    process.exitCode = 1;
    return;
  }

  try {
    const state = await withZetroDatabase((database) =>
      getZetroLoopState(database, runId),
    );

    printHeader("Loop state");
    console.info(`Run: ${runId}`);

    if (!state) {
      console.info("No loop configured for this run.");
      console.info("");
      console.info("Default configuration:");
      console.info(
        `  maxIterations: ${DEFAULT_LOOP_CONFIGURATION.maxIterations}`,
      );
      console.info(
        `  timeoutMs: ${DEFAULT_LOOP_CONFIGURATION.timeoutMs} (${DEFAULT_LOOP_CONFIGURATION.timeoutMs / 60000} min)`,
      );
      console.info(`  dryRun: ${DEFAULT_LOOP_CONFIGURATION.dryRun}`);
      console.info(
        `  stopConditions: ${DEFAULT_LOOP_CONFIGURATION.stopConditions.map((c) => c.type).join(", ")}`,
      );
      return;
    }

    console.info(`Status: ${state.status}`);
    console.info(`Current iteration: ${state.currentIteration}`);
    console.info(`Max iterations: ${state.configuration.maxIterations}`);
    console.info(
      `Timeout: ${state.configuration.timeoutMs}ms (${state.configuration.timeoutMs / 60000} min)`,
    );
    console.info(`Dry run: ${state.configuration.dryRun}`);
    if (state.startedAt) {
      console.info(`Started: ${new Date(state.startedAt).toLocaleString()}`);
    }
    if (state.endedAt) {
      console.info(`Ended: ${new Date(state.endedAt).toLocaleString()}`);
    }
    if (state.cancelledAt) {
      console.info(
        `Cancelled: ${new Date(state.cancelledAt).toLocaleString()} by ${state.cancelledBy}`,
      );
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function startLoopFromArgs(args: string[]) {
  const runId = requireOption(args, "--run");
  const maxIterations = readOption(args, "--max");
  const timeoutMs = readOption(args, "--timeout");

  try {
    const config: ZetroCreateLoopConfigurationInput = {};
    if (maxIterations) {
      config.maxIterations = Number(maxIterations);
    }
    if (timeoutMs) {
      config.timeoutMs = Number(timeoutMs);
    }

    let state = await withZetroDatabase((database) =>
      getZetroLoopState(database, runId),
    );

    if (!state) {
      state = await withZetroDatabase((database) =>
        createZetroLoopState(database, runId, config),
      );
      console.info("Loop configuration created.");
    }

    state = await withZetroDatabase((database) =>
      startZetroLoop(database, runId),
    );

    printHeader("Loop started");
    console.info(`Run: ${runId}`);
    console.info(`Status: ${state.status}`);
    console.info(`Current iteration: ${state.currentIteration}`);
  } catch (error) {
    printWriteError(error);
  }
}

async function stopLoopFromArgs(args: string[]) {
  const runId = requireOption(args, "--run");

  try {
    const state = await withZetroDatabase((database) =>
      completeZetroLoop(database, runId),
    );

    printHeader("Loop stopped");
    console.info(`Run: ${runId}`);
    console.info(`Status: ${state.status}`);
    console.info(`Completed after ${state.currentIteration} iterations`);
  } catch (error) {
    printWriteError(error);
  }
}

async function cancelLoopFromArgs(args: string[]) {
  const runId = requireOption(args, "--run");

  try {
    const state = await withZetroDatabase((database) =>
      cancelZetroLoop(database, runId, "operator"),
    );

    printHeader("Loop cancelled");
    console.info(`Run: ${runId}`);
    console.info(`Status: ${state.status}`);
    console.info(`Cancelled at iteration ${state.currentIteration}`);
  } catch (error) {
    printWriteError(error);
  }
}

async function printLoopEvents(args: string[]) {
  const runId = requireOption(args, "--run");

  try {
    const events = await withZetroDatabase((database) =>
      listZetroIterationEvents(database, runId),
    );

    printHeader("Loop events");
    console.info(`Run: ${runId}`);
    console.info(`Total events: ${events.length}`);

    if (events.length === 0) {
      console.info("No iteration events recorded.");
      return;
    }

    for (const event of events) {
      console.info("");
      console.info(
        `${new Date(event.createdAt).toLocaleString()} | Iter ${event.iteration} | ${event.kind}`,
      );
      console.info(`  ${event.summary}`);
      if (event.detail) {
        console.info(`  ${event.detail}`);
      }
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function searchMemoryFromArgs(args: string[]) {
  const query = args.join(" ").trim();

  if (!query) {
    console.info(
      'Missing search query. Try: npm run zetro -- memory-search "SQL injection"',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const results = await withZetroDatabase((database) =>
      searchMemory(database, query, { limit: 10 }),
    );

    printHeader("Memory search");
    console.info(`Query: "${query}"`);
    console.info(`Results: ${results.length}`);

    if (results.length === 0) {
      console.info("No similar content found.");
      return;
    }

    for (const result of results) {
      console.info("");
      console.info(`Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.info(`Type: ${result.contentType}`);
      console.info(`Content: ${result.content.substring(0, 200)}...`);
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function findSimilarFindingsFromArgs(args: string[]) {
  const title = requireOption(args, "--title");
  const summary = requireOption(args, "--summary");

  try {
    const results = await withZetroDatabase((database) =>
      findSimilarFindings(database, title, summary, { limit: 5 }),
    );

    printHeader("Similar findings");
    console.info(`Title: "${title}"`);
    console.info(`Summary: "${summary}"`);
    console.info(`Similar findings: ${results.length}`);

    if (results.length === 0) {
      console.info("No similar past findings found.");
      return;
    }

    for (const result of results) {
      console.info("");
      console.info(`Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.info(`Content: ${result.content.substring(0, 200)}...`);
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function storeMemoryFromArgs(args: string[]) {
  const findingId = readOption(args, "--finding");
  const content = readOption(args, "--content");
  const runId = readOption(args, "--run");

  if (!content) {
    console.info(
      'Missing --content. Try: npm run zetro -- memory-store --finding <id> --content "finding text"',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const vector = await withZetroDatabase((database) =>
      storeMemoryVector(database, {
        findingId,
        runId,
        content,
        contentType: "finding",
      }),
    );

    printHeader("Memory stored");
    console.info(`Id: ${vector.id}`);
    console.info(`Provider: ${vector.provider}`);
    console.info(`Model: ${vector.model ?? "fallback"}`);
    console.info(`Dimension: ${vector.embedding.length}`);
  } catch (error) {
    printWriteError(error);
  }
}

async function listMemoryFromArgs(args: string[]) {
  const contentType = readOption(args, "--type");
  const runId = readOption(args, "--run");
  const limit = readOption(args, "--limit");

  try {
    const vectors = await withZetroDatabase((database) =>
      listMemoryVectors(database, {
        contentType: contentType as
          | "finding"
          | "run-summary"
          | "chat-message"
          | "command-output"
          | undefined,
        runId,
        limit: limit ? Number(limit) : 20,
      }),
    );

    printHeader("Memory vectors");
    console.info(`Total: ${vectors.length}`);

    if (vectors.length === 0) {
      console.info("No memory vectors stored.");
      return;
    }

    for (const vector of vectors) {
      console.info("");
      console.info(`${vector.id}`);
      console.info(`  Type: ${vector.contentType}`);
      console.info(`  Created: ${new Date(vector.createdAt).toLocaleString()}`);
      console.info(`  Content: ${vector.content.substring(0, 100)}...`);
    }
  } catch (error) {
    printWriteError(error);
  }
}

async function printMemoryStats() {
  try {
    const stats = await withZetroDatabase((database) =>
      getMemoryStats(database),
    );

    printHeader("Memory statistics");
    console.info(`Total vectors: ${stats.total}`);
    console.info("");
    console.info("By type:");
    for (const [type, count] of Object.entries(stats.byType)) {
      console.info(`  ${type}: ${count}`);
    }
    console.info("");
    console.info("By provider:");
    for (const [provider, count] of Object.entries(stats.byProvider)) {
      console.info(`  ${provider}: ${count}`);
    }
  } catch (error) {
    printWriteError(error);
  }
}

function buildPlanScaffold(request: string) {
  return [
    "Intent",
    request,
    "",
    "Repo Context",
    "Read AGENTS.md, Zetro shared contracts, dashboard registry, app-suite manifest, and the relevant app boundary before editing.",
    "",
    "Architecture",
    "Keep behavior app-owned under apps/zetro. Use apps/cxapp and apps/ui only for the existing dashboard shell. Keep execution disabled until approvals and persistence exist.",
    "",
    "Implementation Plan",
    "1. Clarify target behavior.",
    "2. Map existing files and boundaries.",
    "3. Add static contracts or persisted models depending on the phase.",
    "4. Wire dashboard or terminal surface.",
    "5. Run typecheck and targeted lint.",
    "",
    "Risk Register",
    "1. Do not copy Claude source.",
    "2. Do not execute shell commands from Zetro yet.",
    "3. Do not add database/API work before the current slice needs it.",
    "",
    "Done Criteria",
    "1. Output is visible in terminal or dashboard.",
    "2. No runner side effects are introduced.",
    "3. Typecheck passes.",
  ].join("\n");
}

function printPlan(args: string[]) {
  const request = args.join(" ").trim();

  if (!request) {
    console.info(
      'Missing request. Try: npm run zetro -- plan "create persisted playbooks"',
    );
    process.exitCode = 1;
    return;
  }

  printHeader("Maximum-output plan scaffold");
  console.info(buildPlanScaffold(request));
}

async function runChat(args: string[] = []) {
  const settings = buildZetroModelSettings();
  const providerId = (args
    .find((a) => a.startsWith("--provider="))
    ?.split("=")[1] ?? settings.providerId) as string;
  const outputMode = (args
    .find((a) => a.startsWith("--mode="))
    ?.split("=")[1] ?? "normal") as ZetroOutputModeId;
  const modelConfig =
    settings.providerConfigs[
      providerId as keyof typeof settings.providerConfigs
    ];

  printHeader("Zetro shell");
  console.info(`Provider: ${providerId}`);
  console.info(`Output mode: ${outputMode}`);

  if (providerId === "none") {
    console.info("No model configured. Running in manual mode.");
    console.info(
      "To enable model chat, set ZETRO_PROVIDER=ollama-local and ensure Ollama is running.",
    );
  } else {
    const health = await checkProviderHealth(
      providerId as any,
      modelConfig ?? { providerId: providerId as any, enabled: false },
    );
    if (!health.healthy) {
      console.info(
        `Warning: Provider ${providerId} health check failed: ${health.error}`,
      );
    } else {
      console.info(`Provider health: OK (${health.latencyMs}ms)`);
    }
  }

  console.info(
    "Type exit to quit. Commands: help, status, doctor, playbooks, modes, guardrails, runs, findings.",
  );
  console.info("");

  const readline = createInterface({ input, output });
  const chatHistory: Array<{ role: "user" | "assistant"; content: string }> =
    [];

  try {
    let session =
      providerId !== "none"
        ? await withZetroDatabase((db) =>
            createZetroChatSession(db, {
              providerId: providerId as any,
              outputMode,
            }),
          )
        : null;

    while (true) {
      const raw = (await readline.question("zetro> ")).trim();

      if (!raw) {
        continue;
      }

      if (raw === "exit" || raw === "quit") {
        console.info("Leaving Zetro shell.");
        return;
      }

      if (raw === "clear") {
        chatHistory.length = 0;
        console.info("Chat history cleared.");
        continue;
      }

      if (raw.startsWith("/")) {
        await runZetroTerminal(raw.slice(1).split(/\s+/));
        continue;
      }

      chatHistory.push({ role: "user", content: raw });

      if (providerId === "none") {
        console.info(
          "[No model configured. Provide a model provider to enable AI responses.]",
        );
        chatHistory.push({
          role: "assistant",
          content: "No model configured.",
        });
        continue;
      }

      try {
        console.info("[Thinking...]");
        const messages = buildPromptFromMessages(
          chatHistory.slice(0, -1),
          outputMode,
        );
        messages.push({ role: "user", content: raw });

        const response = await completeModelRequest(
          providerId as any,
          modelConfig ?? { providerId: providerId as any, enabled: true },
          messages,
          { temperature: 0.7, maxTokens: 4096 },
        );

        const assistantContent = response.content;
        chatHistory.push({ role: "assistant", content: assistantContent });

        if (session) {
          await withZetroDatabase((db) =>
            Promise.all([
              createZetroChatMessage(db, {
                sessionId: session!.id,
                role: "user",
                content: raw,
                tokens: response.usage?.promptTokens,
                modelId: response.model,
              }),
              createZetroChatMessage(db, {
                sessionId: session!.id,
                role: "assistant",
                content: assistantContent,
                tokens: response.usage?.completionTokens,
                modelId: response.model,
                finishReason: response.finishReason,
              }),
            ]),
          );
        }

        console.info("");
        console.info(assistantContent);
        console.info("");
      } catch (error) {
        console.info(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
        chatHistory.pop();
      }
    }
  } finally {
    readline.close();
  }
}

export async function runZetroTerminal(args = process.argv.slice(2)) {
  const command = resolveCommand(args[0]);
  const rest = args.slice(1);

  if (!command) {
    console.info(`Unknown command: ${args[0]}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  switch (command) {
    case "help":
      printUsage();
      return;
    case "plan":
      printPlan(rest);
      return;
    case "status":
    case "summary":
      printSummary(await loadZetroTerminalData());
      return;
    case "playbooks":
      printPlaybooks(await loadZetroTerminalData());
      return;
    case "playbook":
      printPlaybook(await loadZetroTerminalData(), rest[0]);
      return;
    case "playbook-validate":
      validatePlaybookFromArgs(await loadZetroTerminalData(), rest[0]);
      return;
    case "playbook-evaluate":
      await evaluatePlaybookFromArgs(rest);
      return;
    case "modes":
      printModes(await loadZetroTerminalData());
      return;
    case "guardrails":
      printGuardrails(await loadZetroTerminalData());
      return;
    case "runs":
      printRuns(await loadZetroTerminalData());
      return;
    case "run":
      await printRun(rest[0]);
      return;
    case "create-run":
      await createRunFromArgs(rest);
      return;
    case "add-event":
      await addEventFromArgs(rest);
      return;
    case "output":
      await printRunOutput(rest[0]);
      return;
    case "proposals":
      await printProposals(rest);
      return;
    case "propose":
      await createProposalFromArgs(rest);
      return;
    case "approve":
      await approveProposal(rest[0]);
      return;
    case "reject":
      await rejectProposal(rest[0]);
      return;
    case "findings":
      printFindings(await loadZetroTerminalData());
      return;
    case "create-finding":
      await createFindingFromArgs(rest);
      return;
    case "finding-status":
      await updateFindingStatusFromArgs(rest);
      return;
    case "review-lanes":
      printReviewLanes();
      return;
    case "review-summary":
      await printReviewSummary(rest);
      return;
    case "loop":
      await printLoopState(rest[0]);
      return;
    case "loop-start":
      await startLoopFromArgs(rest);
      return;
    case "loop-stop":
      await stopLoopFromArgs(rest);
      return;
    case "loop-cancel":
      await cancelLoopFromArgs(rest);
      return;
    case "loop-events":
      await printLoopEvents(rest);
      return;
    case "memory-search":
      await searchMemoryFromArgs(rest);
      return;
    case "memory-similar":
      await findSimilarFindingsFromArgs(rest);
      return;
    case "memory-store":
      await storeMemoryFromArgs(rest);
      return;
    case "memory-list":
      await listMemoryFromArgs(rest);
      return;
    case "memory-stats":
      await printMemoryStats();
      return;
    case "assist":
      printAssist(await loadZetroTerminalData());
      return;
    case "doctor":
      runDoctor(await loadZetroTerminalData());
      return;
    case "chat":
      await runChat(rest);
      return;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runZetroTerminal();
}
