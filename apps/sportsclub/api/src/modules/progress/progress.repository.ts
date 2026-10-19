import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { ProgressPayload, ProgressRecord } from "./progress.types.js";

export class ProgressRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async listByMember(memberUuid: string): Promise<ProgressRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_progress")
      .selectAll()
      .where("member_uuid", "=", memberUuid)
      .orderBy("graded_at", "desc")
      .orderBy("id", "desc")
      .execute();
    return rows.map(toRecord);
  }

  async find(uuid: string): Promise<ProgressRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_progress")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(
    uuid: string | null,
    value: ProgressPayload,
    actor: string
  ): Promise<ProgressRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data = {
      member_uuid: value.memberUuid,
      master_uuid: value.masterUuid,
      program_uuid: value.programUuid,
      stage_level: value.stageLevel.trim(),
      score: value.score,
      assessment: value.assessment.trim(),
      private_notes: value.privateNotes.trim(),
      status: value.status,
      graded_at: now,
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    await this.db.transaction().execute(async (tx) => {
      if (current) {
        const result = await tx
          .updateTable("sportsclub_progress")
          .set(data)
          .where("uuid", "=", uuid)
          .where("revision", "=", value.revision)
          .executeTakeFirst();

        if (!Number(result.numUpdatedRows)) {
          throw AppError.conflict("This progress record changed. Reload before saving.");
        }
      } else {
        await tx
          .insertInto("sportsclub_progress")
          .values({
            ...data,
            uuid: key,
            created_at: now
          })
          .execute();
      }

      await tx
        .insertInto("sportsclub_activity")
        .values({
          uuid: randomBytes(4).toString("hex"),
          entity_type: "progress",
          entity_uuid: key,
          actor,
          action: uuid ? "update_progress" : "grade_progress",
          details: `Stage '${value.stageLevel}' assessment: ${value.status} (score: ${value.score ?? "N/A"})`,
          created_at: now
        })
        .execute();
    });

    return (await this.find(key))!;
  }

  async forceDelete(uuid: string): Promise<void> {
    const result = await this.db
      .deleteFrom("sportsclub_progress")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Progress record not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  member_uuid: string;
  master_uuid: string;
  program_uuid: string | null;
  stage_level: string;
  score: number | null;
  assessment: string;
  private_notes: string;
  status: "in_progress" | "passed" | "recommended";
  graded_at: string;
  revision: number;
  created_at: string;
  updated_at: string;
}): ProgressRecord {
  return {
    uuid: row.uuid,
    memberUuid: row.member_uuid,
    masterUuid: row.master_uuid,
    programUuid: row.program_uuid,
    stageLevel: row.stage_level,
    score: row.score,
    assessment: row.assessment,
    privateNotes: row.private_notes,
    status: row.status,
    gradedAt: String(row.graded_at),
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
