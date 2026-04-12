import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";
import type { ZetroRunOutputSection } from "./run-service.js";

export type ZetroCreateOutputSectionInput = {
  id?: string;
  runId: string;
  section: string;
  content: string;
};

function normalizeOutputSectionInput(input: ZetroCreateOutputSectionInput) {
  const section = input.section?.trim();
  const content = input.content?.trim();
  const runId = input.runId?.trim();

  if (!section || !content || !runId) {
    throw new ApplicationError(
      "Zetro output section section, content, and runId are required.",
      {},
      400,
    );
  }

  return {
    id: input.id?.trim() || `zetro-output-section-${randomUUID()}`,
    runId,
    section,
    content,
  };
}

export async function listZetroRunOutputSections(
  database: Kysely<unknown>,
  runId?: string,
) {
  const sections = await listStorePayloads<ZetroRunOutputSection>(
    database,
    zetroTableNames.runOutputSections,
  );

  return sections
    .filter((section) => !runId || section.runId === runId)
    .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
}

export async function createZetroRunOutputSection(
  database: Kysely<unknown>,
  input: ZetroCreateOutputSectionInput,
) {
  const normalizedInput = normalizeOutputSectionInput(input);
  const records = await listStoreRecords<ZetroRunOutputSection>(
    database,
    zetroTableNames.runOutputSections,
  );

  if (records.some((record) => record.id === normalizedInput.id)) {
    throw new ApplicationError(
      "Zetro output section id already exists.",
      { sectionId: normalizedInput.id },
      409,
    );
  }

  const existingSections = records
    .map((record) => record.payload)
    .filter((section) => section.runId === normalizedInput.runId);
  const lastSequence = Math.max(0, ...existingSections.map((s) => s.sequence));

  const section = {
    id: normalizedInput.id,
    runId: normalizedInput.runId,
    sequence: lastSequence + 1,
    section: normalizedInput.section,
    content: normalizedInput.content,
    createdAt: new Date().toISOString(),
  } satisfies ZetroRunOutputSection;

  await replaceStoreRecords(database, zetroTableNames.runOutputSections, [
    ...records,
    {
      id: section.id,
      moduleKey: normalizedInput.runId,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: section,
    },
  ]);

  return section;
}

export async function replaceZetroRunOutputSections(
  database: Kysely<unknown>,
  runId: string,
  sections: Array<{ section: string; content: string }>,
) {
  const records = await listStoreRecords<ZetroRunOutputSection>(
    database,
    zetroTableNames.runOutputSections,
  );

  const remainingRecords = records.filter(
    (record) => record.payload.runId !== runId,
  );

  const newSections: ZetroRunOutputSection[] = sections.map((s, index) => ({
    id: `zetro-output-section-${randomUUID()}`,
    runId,
    sequence: index + 1,
    section: s.section,
    content: s.content,
    createdAt: new Date().toISOString(),
  }));

  await replaceStoreRecords(database, zetroTableNames.runOutputSections, [
    ...remainingRecords,
    ...newSections.map((section, index) => ({
      id: section.id,
      moduleKey: runId,
      sortOrder: (remainingRecords.at(-1)?.sortOrder ?? 0) + (index + 1) * 10,
      payload: section,
    })),
  ]);

  return newSections;
}
