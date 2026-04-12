import {
  getServerConfig,
  type ServerConfig,
} from "../../framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../framework/src/runtime/database/index.js"
import {
  zetroDefaultOutputMode,
  zetroGuardrailTemplates,
  zetroOutputModes,
  zetroSampleFindings,
  zetroSampleRuns,
  zetroStaticPlaybooks,
  type ZetroGuardrailTemplate,
  type ZetroOutputMode,
  type ZetroOutputModeId,
} from "../shared/index.js"
import {
  getZetroDashboardSummary,
  listZetroFindings,
  listZetroGuardrails,
  listZetroPlaybooks,
  listZetroRuns,
  readZetroSettings,
  type ZetroDashboardSummary,
  type ZetroFinding,
  type ZetroPlaybookWithPhases,
  type ZetroRun,
  type ZetroSettingsSnapshot,
} from "./services/index.js"

export type ZetroTerminalDataSource = "database" | "static"

export type ZetroTerminalData = {
  source: ZetroTerminalDataSource
  fallbackReason?: string
  playbooks: ZetroPlaybookWithPhases[]
  outputModes: ZetroOutputMode[]
  defaultOutputMode: ZetroOutputModeId
  guardrails: ZetroGuardrailTemplate[]
  runs: ZetroRun[]
  findings: ZetroFinding[]
  summary: ZetroDashboardSummary
  settings: ZetroSettingsSnapshot
}

function toFallbackReason(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database read failure."
}

function createStaticSettings(): ZetroSettingsSnapshot {
  return {
    runtimeLock: {
      runnerMode: "manual",
      commandExecution: "disabled",
      llmCalls: "disabled",
      networkCalls: "disabled",
      autonomousLoop: "disabled",
    },
    outputModes: {
      defaultOutputMode: zetroDefaultOutputMode,
      modes: zetroOutputModes,
    },
  }
}

function createStaticSummary(settings: ZetroSettingsSnapshot): ZetroDashboardSummary {
  return {
    playbooks: zetroStaticPlaybooks.length,
    activePlaybooks: zetroStaticPlaybooks.filter((playbook) => playbook.status === "active").length,
    approvalRequiredPlaybooks: zetroStaticPlaybooks.filter((playbook) => playbook.requiresApproval).length,
    highestPlaybookRisk: "critical",
    runs: zetroSampleRuns.length,
    activeRuns: zetroSampleRuns.filter((run) =>
      ["queued", "awaiting-approval", "running", "blocked"].includes(run.status)
    ).length,
    findings: zetroSampleFindings.length,
    openFindings: zetroSampleFindings.filter((finding) => finding.status === "open").length,
    guardrails: zetroGuardrailTemplates.length,
    outputModes: zetroOutputModes.length,
    defaultOutputMode: settings.outputModes.defaultOutputMode,
    runnerMode: settings.runtimeLock.runnerMode,
    commandExecution: settings.runtimeLock.commandExecution,
  }
}

function loadStaticZetroTerminalData(fallbackReason?: string): ZetroTerminalData {
  const settings = createStaticSettings()

  return {
    source: "static",
    fallbackReason,
    playbooks: zetroStaticPlaybooks.map((playbook) => ({
      ...playbook,
      phases: playbook.phases.map((phase, index) => ({
        ...phase,
        playbookId: playbook.id,
        sequence: index + 1,
      })),
    })),
    outputModes: zetroOutputModes,
    defaultOutputMode: zetroDefaultOutputMode,
    guardrails: zetroGuardrailTemplates,
    runs: zetroSampleRuns,
    findings: zetroSampleFindings,
    summary: createStaticSummary(settings),
    settings,
  }
}

async function loadDatabaseZetroTerminalData(config: ServerConfig) {
  const databases = createRuntimeDatabases(config)

  try {
    await prepareApplicationDatabase(databases)

    const [playbooks, runs, findings, guardrails, settings, summary] =
      await Promise.all([
        listZetroPlaybooks(databases.primary),
        listZetroRuns(databases.primary),
        listZetroFindings(databases.primary),
        listZetroGuardrails(databases.primary),
        readZetroSettings(databases.primary),
        getZetroDashboardSummary(databases.primary),
      ])

    return {
      source: "database",
      playbooks,
      outputModes: settings.outputModes.modes,
      defaultOutputMode: settings.outputModes.defaultOutputMode,
      guardrails,
      runs,
      findings,
      summary,
      settings,
    } satisfies ZetroTerminalData
  } finally {
    await databases.destroy()
  }
}

export async function loadZetroTerminalData() {
  try {
    return await loadDatabaseZetroTerminalData(getServerConfig(process.cwd()))
  } catch (error) {
    return loadStaticZetroTerminalData(toFallbackReason(error))
  }
}
