import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js";
import {
  zetroDefaultOutputMode,
  zetroGuardrailTemplates,
  zetroOutputModes,
  zetroSampleFindings,
  zetroSampleRuns,
  zetroStaticPlaybooks,
} from "../../shared/index.js";

import { zetroTableNames } from "../table-names.js";

export const zetroDefaultsSeeder = defineDatabaseSeeder({
  id: "zetro:defaults:01-zetro-defaults",
  appId: "zetro",
  moduleKey: "defaults",
  name: "Seed Zetro default playbooks and manual-mode settings",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      zetroTableNames.playbooks,
      zetroStaticPlaybooks.map((playbook, index) => ({
        id: playbook.id,
        moduleKey: playbook.kind,
        sortOrder: (index + 1) * 10,
        payload: {
          id: playbook.id,
          name: playbook.name,
          kind: playbook.kind,
          family: playbook.family,
          summary: playbook.summary,
          description: playbook.description,
          defaultOutputMode: playbook.defaultOutputMode,
          riskLevel: playbook.riskLevel,
          requiresApproval: playbook.requiresApproval,
          status: playbook.status,
          reviewLanes: playbook.reviewLanes,
        },
      })),
    );

    await replaceJsonStoreRecords(
      database,
      zetroTableNames.playbookPhases,
      zetroStaticPlaybooks.flatMap((playbook, playbookIndex) =>
        playbook.phases.map((phase, phaseIndex) => ({
          id: `${playbook.id}:${phase.id}`,
          moduleKey: playbook.id,
          sortOrder: (playbookIndex + 1) * 100 + phaseIndex + 1,
          payload: {
            ...phase,
            playbookId: playbook.id,
            sequence: phaseIndex + 1,
          },
        })),
      ),
    );

    await replaceJsonStoreRecords(
      database,
      zetroTableNames.runs,
      zetroSampleRuns.map((run, index) => ({
        id: run.id,
        moduleKey: run.status,
        sortOrder: (index + 1) * 10,
        payload: run,
      })),
    );

    await replaceJsonStoreRecords(
      database,
      zetroTableNames.findings,
      zetroSampleFindings.map((finding, index) => ({
        id: finding.id,
        moduleKey: finding.category,
        sortOrder: (index + 1) * 10,
        payload: finding,
      })),
    );

    await replaceJsonStoreRecords(
      database,
      zetroTableNames.guardrails,
      zetroGuardrailTemplates.map((guardrail, index) => ({
        id: guardrail.id,
        moduleKey: guardrail.event,
        sortOrder: (index + 1) * 10,
        payload: guardrail,
      })),
    );

    await replaceJsonStoreRecords(database, zetroTableNames.settings, [
      {
        id: "runtime-lock",
        moduleKey: "runner",
        sortOrder: 10,
        payload: {
          runnerMode: "manual",
          commandExecution: "disabled",
          llmCalls: "disabled",
          networkCalls: "disabled",
          autonomousLoop: "disabled",
        },
      },
      {
        id: "output-modes",
        moduleKey: "output",
        sortOrder: 20,
        payload: {
          defaultOutputMode: zetroDefaultOutputMode,
          modes: zetroOutputModes,
        },
      },
    ]);

    const defaultAllowlistEntries = [
      {
        id: "allow-npm",
        command: "npm",
        category: "build" as const,
        description: "Node package manager for build, test, and scripts.",
        enabled: true,
        maxArgs: 10,
        maxTimeoutSeconds: 300,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
      {
        id: "allow-tsc",
        command: "tsc",
        category: "typecheck" as const,
        description: "TypeScript compiler for type checking.",
        enabled: true,
        maxArgs: 5,
        maxTimeoutSeconds: 120,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
      {
        id: "allow-npx",
        command: "npx",
        category: "build" as const,
        description: "Node package executor for running packages.",
        enabled: true,
        maxArgs: 10,
        maxTimeoutSeconds: 300,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
      {
        id: "allow-git",
        command: "git",
        category: "git" as const,
        description: "Git for version control operations.",
        enabled: true,
        maxArgs: 10,
        maxTimeoutSeconds: 60,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ];

    await replaceJsonStoreRecords(
      database,
      zetroTableNames.commandAllowlist,
      defaultAllowlistEntries.map((entry, index) => ({
        id: entry.id,
        moduleKey: entry.category,
        sortOrder: (index + 1) * 10,
        payload: entry,
      })),
    );
  },
});
