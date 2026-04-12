import { existsSync } from "node:fs"
import { stdin as input, stdout as output } from "node:process"
import { resolve } from "node:path"
import { createInterface } from "node:readline/promises"
import { pathToFileURL } from "node:url"

import {
  zetroDefaultOutputMode,
  zetroGuardrailTemplates,
  zetroOutputModes,
  zetroSampleFindings,
  zetroSampleRuns,
  zetroStaticPlaybooks,
} from "../shared/index.js"

type ZetroTerminalCommand =
  | "help"
  | "status"
  | "summary"
  | "playbooks"
  | "playbook"
  | "modes"
  | "guardrails"
  | "runs"
  | "findings"
  | "plan"
  | "assist"
  | "doctor"
  | "chat"

function printHeader(title: string) {
  console.info("")
  console.info(`== ${title} ==`)
}

function printUsage() {
  printHeader("Zetro terminal")
  console.info("Usage: npm run zetro -- <command> [value]")
  console.info("")
  console.info("Commands:")
  console.info("  help                         Show this help.")
  console.info("  status                       Show current lock and catalog counts.")
  console.info("  summary                      Show the current terminal-first catalog summary.")
  console.info("  playbooks                    List static playbooks.")
  console.info("  playbook <id>                Show one playbook with phases.")
  console.info("  modes                        List output modes.")
  console.info("  guardrails                   List guardrail templates.")
  console.info("  runs                         List sample runs.")
  console.info("  findings                     List sample findings.")
  console.info("  plan <request>               Print a maximum-output plan scaffold.")
  console.info("  assist                       Show the Zetro Assist read order and runtime lock.")
  console.info("  doctor                       Validate terminal catalog and Assist files.")
  console.info("  chat                         Start an interactive Zetro shell.")
  console.info("")
  console.info("Current runner mode: manual. No shell commands, writes, LLM calls, or network calls are executed.")
}

function resolveCommand(value: string | undefined): ZetroTerminalCommand | null {
  switch (value) {
    case undefined:
    case "help":
      return "help"
    case "status":
    case "summary":
    case "playbooks":
    case "playbook":
    case "modes":
    case "guardrails":
    case "runs":
    case "findings":
    case "plan":
    case "assist":
    case "doctor":
    case "chat":
      return value
    default:
      return null
  }
}

function printSummary() {
  printHeader("Summary")
  console.info(`Playbooks: ${zetroStaticPlaybooks.length}`)
  console.info(`Output modes: ${zetroOutputModes.length}`)
  console.info(`Default output mode: ${zetroDefaultOutputMode}`)
  console.info(`Guardrail templates: ${zetroGuardrailTemplates.length}`)
  console.info(`Sample runs: ${zetroSampleRuns.length}`)
  console.info(`Sample findings: ${zetroSampleFindings.length}`)
  console.info("Runner mode: manual")
  console.info("Execution: disabled")
}

function getDuplicateValues(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
    }

    seen.add(value)
  }

  return [...duplicates]
}

function runDoctor() {
  printHeader("Doctor")

  const outputModeIds = new Set(zetroOutputModes.map((mode) => mode.id))
  const playbookIdDuplicates = getDuplicateValues(zetroStaticPlaybooks.map((playbook) => playbook.id))
  const guardrailIdDuplicates = getDuplicateValues(zetroGuardrailTemplates.map((guardrail) => guardrail.id))
  const missingOutputModes = zetroStaticPlaybooks
    .filter((playbook) => !outputModeIds.has(playbook.defaultOutputMode))
    .map((playbook) => `${playbook.id}:${playbook.defaultOutputMode}`)
  const emptyPhasePlaybooks = zetroStaticPlaybooks
    .filter((playbook) => playbook.phases.length === 0)
    .map((playbook) => playbook.id)
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
  ]
  const missingAssistFiles = assistFiles.filter(
    (fileName) => !existsSync(resolve("apps", "zetro", "ASSIST", fileName))
  )
  const failures = [
    ...playbookIdDuplicates.map((id) => `Duplicate playbook id: ${id}`),
    ...guardrailIdDuplicates.map((id) => `Duplicate guardrail id: ${id}`),
    ...missingOutputModes.map((entry) => `Unknown playbook output mode: ${entry}`),
    ...emptyPhasePlaybooks.map((id) => `Playbook has no phases: ${id}`),
    ...missingAssistFiles.map((fileName) => `Missing Assist file: ${fileName}`),
  ]

  if (failures.length === 0) {
    console.info("OK catalog ids are unique")
    console.info("OK playbook output modes are valid")
    console.info("OK playbooks have phases")
    console.info("OK Assist files are present")
    console.info("OK runner remains manual")
    return
  }

  for (const failure of failures) {
    console.info(`FAIL ${failure}`)
  }

  process.exitCode = 1
}

function printAssist() {
  printHeader("Assist")
  console.info("Read order:")
  console.info("1. apps/zetro/ASSIST/README.md")
  console.info("2. apps/zetro/ASSIST/BEHAVIOR.md")
  console.info("3. apps/zetro/ASSIST/MASTER_PLAN.md")
  console.info("4. apps/zetro/ASSIST/END_TO_END_CREATION.md")
  console.info("5. apps/zetro/ASSIST/WALKTHROUGH.md")
  console.info("6. apps/zetro/ASSIST/NEEDED_THINGS.md")
  console.info("7. apps/zetro/ASSIST/SOURCES.md")
  console.info("8. apps/zetro/ASSIST/OPERATING_MODEL.md")
  console.info("9. apps/zetro/ASSIST/QUALITY_GATES.md")
  console.info("10. apps/zetro/ASSIST/DECISIONS.md")
  console.info("11. apps/zetro/ASSIST/SYSTEM_PROMPT.md")
  console.info("")
  console.info("Current lock:")
  console.info("- runner: manual")
  console.info("- command execution: disabled")
  console.info("- LLM calls: disabled")
  console.info("- network calls: disabled")
  console.info("- autonomous loop: disabled")
}

function printPlaybooks() {
  printHeader("Playbooks")
  for (const playbook of zetroStaticPlaybooks) {
    console.info(`${playbook.id} | ${playbook.name} | ${playbook.kind} | ${playbook.status} | ${playbook.defaultOutputMode}`)
    console.info(`  ${playbook.summary}`)
  }
}

function printPlaybook(playbookId: string | undefined) {
  if (!playbookId) {
    console.info("Missing playbook id. Try: npm run zetro -- playbook feature-dev")
    process.exitCode = 1
    return
  }

  const playbook = zetroStaticPlaybooks.find((item) => item.id === playbookId)

  if (!playbook) {
    console.info(`Unknown playbook: ${playbookId}`)
    process.exitCode = 1
    return
  }

  printHeader(playbook.name)
  console.info(`ID: ${playbook.id}`)
  console.info(`Kind: ${playbook.kind}`)
  console.info(`Family: ${playbook.family}`)
  console.info(`Status: ${playbook.status}`)
  console.info(`Risk: ${playbook.riskLevel}`)
  console.info(`Output mode: ${playbook.defaultOutputMode}`)
  console.info(`Approval: ${playbook.requiresApproval ? "required" : "not required"}`)
  console.info("")
  console.info(playbook.description)
  console.info("")
  console.info("Phases:")
  for (const [index, phase] of playbook.phases.entries()) {
    console.info(`${index + 1}. ${phase.name}${phase.approvalGate ? " [approval gate]" : ""}`)
    console.info(`   Objective: ${phase.objective}`)
    console.info(`   Output: ${phase.expectedOutput}`)
  }
}

function printModes() {
  printHeader("Output modes")
  for (const mode of zetroOutputModes) {
    console.info(`${mode.id} | ${mode.name}`)
    console.info(`  ${mode.summary}`)
    console.info(`  Sections: ${mode.sections.join(", ")}`)
  }
}

function printGuardrails() {
  printHeader("Guardrails")
  for (const guardrail of zetroGuardrailTemplates) {
    console.info(`${guardrail.id} | ${guardrail.event} | ${guardrail.severity}`)
    console.info(`  ${guardrail.summary}`)
  }
}

function printRuns() {
  printHeader("Sample runs")
  for (const run of zetroSampleRuns) {
    console.info(`${run.id} | ${run.status} | ${run.outputMode}`)
    console.info(`  ${run.title}`)
    console.info(`  ${run.summary}`)
  }
}

function printFindings() {
  printHeader("Sample findings")
  for (const finding of zetroSampleFindings) {
    console.info(`${finding.id} | ${finding.severity} | ${finding.category} | ${finding.confidence}% | ${finding.status}`)
    console.info(`  ${finding.title}`)
    console.info(`  ${finding.summary}`)
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
  ].join("\n")
}

function printPlan(args: string[]) {
  const request = args.join(" ").trim()

  if (!request) {
    console.info("Missing request. Try: npm run zetro -- plan \"create persisted playbooks\"")
    process.exitCode = 1
    return
  }

  printHeader("Maximum-output plan scaffold")
  console.info(buildPlanScaffold(request))
}

async function runChat() {
  printHeader("Zetro shell")
  console.info("Manual mode. Type help, status, doctor, playbooks, modes, guardrails, runs, findings, plan <request>, or exit.")

  const readline = createInterface({ input, output })

  try {
    while (true) {
      const raw = (await readline.question("zetro> ")).trim()

      if (!raw) {
        continue
      }

      if (raw === "exit" || raw === "quit") {
        console.info("Leaving Zetro shell.")
        return
      }

      await runZetroTerminal(raw.split(/\s+/))
    }
  } finally {
    readline.close()
  }
}

export async function runZetroTerminal(args = process.argv.slice(2)) {
  const command = resolveCommand(args[0])
  const rest = args.slice(1)

  if (!command) {
    console.info(`Unknown command: ${args[0]}`)
    printUsage()
    process.exitCode = 1
    return
  }

  switch (command) {
    case "help":
      printUsage()
      return
    case "status":
    case "summary":
      printSummary()
      return
    case "playbooks":
      printPlaybooks()
      return
    case "playbook":
      printPlaybook(rest[0])
      return
    case "modes":
      printModes()
      return
    case "guardrails":
      printGuardrails()
      return
    case "runs":
      printRuns()
      return
    case "findings":
      printFindings()
      return
    case "plan":
      printPlan(rest)
      return
    case "assist":
      printAssist()
      return
    case "doctor":
      runDoctor()
      return
    case "chat":
      await runChat()
      return
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runZetroTerminal()
}
