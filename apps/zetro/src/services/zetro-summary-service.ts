import type { Kysely } from "kysely"

import type { ZetroRiskLevel } from "../../shared/index.js"
import { listZetroFindings } from "./finding-service.js"
import { listZetroGuardrails } from "./guardrail-service.js"
import { listZetroPlaybooks } from "./playbook-service.js"
import { listZetroRuns } from "./run-service.js"
import { readZetroSettings } from "./settings-service.js"

export type ZetroDashboardSummary = {
  playbooks: number
  activePlaybooks: number
  approvalRequiredPlaybooks: number
  highestPlaybookRisk: ZetroRiskLevel | null
  runs: number
  activeRuns: number
  findings: number
  openFindings: number
  guardrails: number
  outputModes: number
  defaultOutputMode: string
  runnerMode: string
  commandExecution: string
}

const riskRank: Record<ZetroRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

const activeRunStatuses = new Set(["queued", "awaiting-approval", "running", "blocked"])

function pickHighestRisk(risks: ZetroRiskLevel[]) {
  return risks.reduce<ZetroRiskLevel | null>((highestRisk, risk) => {
    if (!highestRisk) {
      return risk
    }

    return riskRank[risk] > riskRank[highestRisk] ? risk : highestRisk
  }, null)
}

export async function getZetroDashboardSummary(database: Kysely<unknown>) {
  const [playbooks, runs, findings, guardrails, settings] = await Promise.all([
    listZetroPlaybooks(database),
    listZetroRuns(database),
    listZetroFindings(database),
    listZetroGuardrails(database),
    readZetroSettings(database),
  ])

  return {
    playbooks: playbooks.length,
    activePlaybooks: playbooks.filter((playbook) => playbook.status === "active").length,
    approvalRequiredPlaybooks: playbooks.filter((playbook) => playbook.requiresApproval).length,
    highestPlaybookRisk: pickHighestRisk(playbooks.map((playbook) => playbook.riskLevel)),
    runs: runs.length,
    activeRuns: runs.filter((run) => activeRunStatuses.has(run.status)).length,
    findings: findings.length,
    openFindings: findings.filter((finding) => finding.status === "open").length,
    guardrails: guardrails.length,
    outputModes: settings.outputModes.modes.length,
    defaultOutputMode: settings.outputModes.defaultOutputMode,
    runnerMode: settings.runtimeLock.runnerMode,
    commandExecution: settings.runtimeLock.commandExecution,
  } satisfies ZetroDashboardSummary
}
