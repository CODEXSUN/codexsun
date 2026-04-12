import { useQuery } from "@tanstack/react-query"

import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import type {
  ZetroGuardrailTemplate,
  ZetroOutputMode,
  ZetroOutputModeId,
  ZetroPlaybook,
  ZetroPlaybookPhase,
  ZetroSampleFinding,
  ZetroSampleRun,
} from "../../../shared/index"

export type ZetroDashboardSummary = {
  playbooks: number
  activePlaybooks: number
  approvalRequiredPlaybooks: number
  highestPlaybookRisk: string | null
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

export type ZetroPersistedPlaybookPhase = ZetroPlaybookPhase & {
  playbookId: string
  sequence: number
}

export type ZetroPersistedPlaybook = Omit<ZetroPlaybook, "phases"> & {
  phases: ZetroPersistedPlaybookPhase[]
}

export type ZetroRunEvent = {
  id: string
  runId: string
  sequence: number
  kind: "note" | "status" | "approval" | "finding" | "command-proposal" | "output"
  summary: string
  detail?: string
  createdAt: string
}

export type ZetroFinding = ZetroSampleFinding

export type ZetroRunWithDetails = ZetroSampleRun & {
  events: ZetroRunEvent[]
  findings: ZetroFinding[]
}

export type ZetroSettingsSnapshot = {
  runtimeLock: {
    runnerMode: "manual"
    commandExecution: "disabled"
    llmCalls: "disabled"
    networkCalls: "disabled"
    autonomousLoop: "disabled"
  }
  outputModes: {
    defaultOutputMode: ZetroOutputModeId
    modes: ZetroOutputMode[]
  }
}

type ListResponse<T> = {
  items: T[]
}

const zetroQueryKeys = {
  summary: ["zetro", "summary"] as const,
  playbooks: ["zetro", "playbooks"] as const,
  runs: ["zetro", "runs"] as const,
  findings: ["zetro", "findings"] as const,
  guardrails: ["zetro", "guardrails"] as const,
  settings: ["zetro", "settings"] as const,
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export function getZetroSummary() {
  return requestJson<ZetroDashboardSummary>("/internal/v1/zetro/summary")
}

export function listZetroPlaybooks() {
  return requestJson<ListResponse<ZetroPersistedPlaybook>>(
    "/internal/v1/zetro/playbooks"
  )
}

export function listZetroRuns() {
  return requestJson<ListResponse<ZetroSampleRun>>("/internal/v1/zetro/runs")
}

export function listZetroFindings() {
  return requestJson<ListResponse<ZetroFinding>>("/internal/v1/zetro/findings")
}

export function listZetroGuardrails() {
  return requestJson<ListResponse<ZetroGuardrailTemplate>>(
    "/internal/v1/zetro/guardrails"
  )
}

export function getZetroSettings() {
  return requestJson<ZetroSettingsSnapshot>("/internal/v1/zetro/settings")
}

export function useZetroSummaryQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.summary,
    queryFn: getZetroSummary,
  })
}

export function useZetroPlaybooksQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.playbooks,
    queryFn: listZetroPlaybooks,
    select: (payload) => payload.items,
  })
}

export function useZetroRunsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.runs,
    queryFn: listZetroRuns,
    select: (payload) => payload.items,
  })
}

export function useZetroFindingsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.findings,
    queryFn: listZetroFindings,
    select: (payload) => payload.items,
  })
}

export function useZetroGuardrailsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.guardrails,
    queryFn: listZetroGuardrails,
    select: (payload) => payload.items,
  })
}

export function useZetroSettingsQuery() {
  return useQuery({
    queryKey: zetroQueryKeys.settings,
    queryFn: getZetroSettings,
  })
}
