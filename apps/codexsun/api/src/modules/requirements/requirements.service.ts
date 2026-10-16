import { createHash } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { RequirementsRepository } from "./requirements.repository.js";
import type {
  RequirementInput,
  RequirementPatch,
  RequirementRecord,
  RequirementListOptions
} from "./requirements.types.js";

export class RequirementsService {
  constructor(
    private readonly repository: RequirementsRepository,
    private readonly actor: string,
    private readonly canApprove: boolean
  ) {}
  list(options: RequirementListOptions) {
    return this.repository.list(options, this.actor, this.canApprove);
  }
  async get(uuid: string) {
    const record = await this.repository.get(uuid);
    if (!record || (record.createdBy !== this.actor && !this.canApprove))
      throw AppError.notFound("Requirement was not found.");
    return record;
  }
  async create(input: RequirementInput) {
    try {
      return await this.repository.transaction(async (repository) => {
        const existing = await repository.getByClientKey(this.actor, input.clientKey);
        if (existing) return this.match(existing, input);
        const record = await repository.insert(input, this.actor, fingerprint(input));
        await repository.addActivity(record, "created", this.actor);
        return record;
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const existing = await this.repository.getByClientKey(this.actor, input.clientKey);
      if (!existing) throw AppError.conflict("Please retry with a new request key.");
      return this.match(existing, input);
    }
  }
  update(uuid: string, input: RequirementPatch) {
    return this.change(uuid, input.revision, "updated", (record) => {
      this.creator(record);
      if (record.status !== "draft" && record.status !== "rejected")
        throw AppError.conflict("Only draft or rejected requirements may be edited.");
      return {
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: "draft" as const,
        decision_note: ""
      };
    });
  }
  submit(uuid: string, revision: number) {
    return this.change(uuid, revision, "submitted", (record) => {
      this.creator(record);
      if (record.status !== "draft")
        throw AppError.conflict("Only draft requirements may be submitted.");
      return { status: "awaiting_approval" as const };
    });
  }
  async decision(uuid: string, revision: number, decision: "approved" | "rejected", note: string) {
    if (!this.canApprove) throw AppError.forbidden("Requirement approval permission is required.");
    return this.change(
      uuid,
      revision,
      decision,
      (record) => {
        if (record.status !== "awaiting_approval")
          throw AppError.conflict("Requirement is not awaiting approval.");
        return { status: decision, decision_note: note };
      },
      note
    );
  }
  async activity(uuid: string) {
    await this.get(uuid);
    return this.repository.activity(uuid);
  }
  private match(
    existing: { record: RequirementRecord; requestHash: string },
    input: RequirementInput
  ) {
    if (existing.requestHash !== fingerprint(input))
      throw AppError.conflict("Request key already contains different content.");
    return existing.record;
  }
  private creator(record: RequirementRecord) {
    if (record.createdBy !== this.actor)
      throw AppError.forbidden("Only the creator may change this requirement.");
  }
  private change(
    uuid: string,
    revision: number,
    action: "updated" | "submitted" | "approved" | "rejected",
    build: (record: RequirementRecord) => Parameters<RequirementsRepository["compareAndSet"]>[1],
    note = ""
  ) {
    return this.repository.transaction(async (repository) => {
      const record = await new RequirementsService(repository, this.actor, this.canApprove).get(
        uuid
      );
      if (record.revision !== revision)
        throw AppError.conflict("Requirement changed. Refresh before continuing.");
      const change = build(record);
      if (!(await repository.compareAndSet(record, change)))
        throw AppError.conflict("Requirement changed. Refresh before continuing.");
      const updated = (await repository.get(uuid))!;
      await repository.addActivity(updated, action, this.actor, note);
      return updated;
    });
  }
}
function isDuplicate(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    ["ER_DUP_ENTRY", "SQLITE_CONSTRAINT_UNIQUE"].includes(String(error.code))
  );
}

function fingerprint(input: RequirementInput) {
  return createHash("sha256")
    .update(JSON.stringify([input.title, input.description, input.priority, input.origin]))
    .digest("hex");
}
