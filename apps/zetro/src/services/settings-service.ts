import type { Kysely } from "kysely"

import { zetroTableNames } from "../../database/table-names.js"
import {
  zetroDefaultOutputMode,
  zetroOutputModes,
  type ZetroOutputMode,
  type ZetroOutputModeId,
} from "../../shared/index.js"
import { listStorePayloads } from "../data/query-database.js"

export type ZetroRuntimeLockSettings = {
  runnerMode: "manual"
  commandExecution: "disabled"
  llmCalls: "disabled"
  networkCalls: "disabled"
  autonomousLoop: "disabled"
}

export type ZetroOutputModeSettings = {
  defaultOutputMode: ZetroOutputModeId
  modes: ZetroOutputMode[]
}

export type ZetroSettingsRecord =
  | {
      runnerMode: "manual"
      commandExecution: "disabled"
      llmCalls: "disabled"
      networkCalls: "disabled"
      autonomousLoop: "disabled"
    }
  | {
      defaultOutputMode: ZetroOutputModeId
      modes: ZetroOutputMode[]
    }

export type ZetroSettingsSnapshot = {
  runtimeLock: ZetroRuntimeLockSettings
  outputModes: ZetroOutputModeSettings
}

const defaultRuntimeLock = {
  runnerMode: "manual",
  commandExecution: "disabled",
  llmCalls: "disabled",
  networkCalls: "disabled",
  autonomousLoop: "disabled",
} satisfies ZetroRuntimeLockSettings

const defaultOutputModeSettings = {
  defaultOutputMode: zetroDefaultOutputMode,
  modes: zetroOutputModes,
} satisfies ZetroOutputModeSettings

function isRuntimeLockSettings(
  value: ZetroSettingsRecord
): value is ZetroRuntimeLockSettings {
  return "runnerMode" in value
}

function isOutputModeSettings(
  value: ZetroSettingsRecord
): value is ZetroOutputModeSettings {
  return "defaultOutputMode" in value
}

export async function readZetroSettings(database: Kysely<unknown>) {
  const settings = await listStorePayloads<ZetroSettingsRecord>(
    database,
    zetroTableNames.settings
  )

  return {
    runtimeLock:
      settings.find((setting) => isRuntimeLockSettings(setting)) ??
      defaultRuntimeLock,
    outputModes:
      settings.find((setting) => isOutputModeSettings(setting)) ??
      defaultOutputModeSettings,
  } satisfies ZetroSettingsSnapshot
}
