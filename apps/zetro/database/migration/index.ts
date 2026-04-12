import { zetroPlaybooksMigration } from "./01-zetro-playbooks.js"
import { zetroRunsMigration } from "./02-zetro-runs.js"
import { zetroFindingsMigration } from "./03-zetro-findings.js"
import { zetroGuardrailsMigration } from "./04-zetro-guardrails.js"
import { zetroSettingsMigration } from "./05-zetro-settings.js"

export const zetroDatabaseMigrations = [
  zetroPlaybooksMigration,
  zetroRunsMigration,
  zetroFindingsMigration,
  zetroGuardrailsMigration,
  zetroSettingsMigration,
]
