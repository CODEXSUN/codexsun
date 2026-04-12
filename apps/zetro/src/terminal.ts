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
  updateZetroFindingStatus,
  updateZetroCommandProposalStatus,
} from "./services/index.js";
import type {
  ZetroFindingStatus,
  ZetroCreateFindingInput,
  ZetroCreateRunEventInput,
  ZetroCreateRunInput,
  ZetroCreateCommandProposalInput,
  ZetroRunEventKind,
} from "./services/index.js";
import type { ZetroPlaybookPhase } from "../shared/index.js";
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
    "  chat                         Start an interactive Zetro shell.",
  );
  console.info("");
  console.info(
    "Current runner mode: manual. No shell commands, writes, LLM calls, or network calls are executed.",
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

async function runChat() {
  printHeader("Zetro shell");
  console.info(
    "Manual mode. Type help, status, doctor, playbooks, modes, guardrails, runs, findings, plan <request>, or exit.",
  );

  const readline = createInterface({ input, output });

  try {
    while (true) {
      const raw = (await readline.question("zetro> ")).trim();

      if (!raw) {
        continue;
      }

      if (raw === "exit" || raw === "quit") {
        console.info("Leaving Zetro shell.");
        return;
      }

      await runZetroTerminal(raw.split(/\s+/));
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
    case "assist":
      printAssist(await loadZetroTerminalData());
      return;
    case "doctor":
      runDoctor(await loadZetroTerminalData());
      return;
    case "chat":
      await runChat();
      return;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runZetroTerminal();
}
