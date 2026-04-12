import { zetroPlaybooksMigration } from "./01-zetro-playbooks.js";
import { zetroRunsMigration } from "./02-zetro-runs.js";
import { zetroFindingsMigration } from "./03-zetro-findings.js";
import { zetroGuardrailsMigration } from "./04-zetro-guardrails.js";
import { zetroSettingsMigration } from "./05-zetro-settings.js";
import { zetroRunOutputSectionsMigration } from "./06-zetro-run-output-sections.js";
import { zetroCommandProposalsMigration } from "./07-zetro-command-proposals.js";

export const zetroDatabaseMigrations = [
  zetroPlaybooksMigration,
  zetroRunsMigration,
  zetroFindingsMigration,
  zetroGuardrailsMigration,
  zetroSettingsMigration,
  zetroRunOutputSectionsMigration,
  zetroCommandProposalsMigration,
];
