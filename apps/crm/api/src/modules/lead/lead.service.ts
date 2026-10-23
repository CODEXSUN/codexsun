import { AppError } from "@codexsun/framework/errors";
import { LeadRepository } from "./lead.repository.js";
import { createLeadFollowUp } from "../task/index.js";
import type { LeadContext, LeadIntake } from "./lead.types.js";
export class LeadService {
  private readonly repository: LeadRepository;
  constructor(private readonly context: LeadContext) {
    this.repository = new LeadRepository(context);
  }
  async accept(input: LeadIntake) {
    await this.context.authorize("crm.lead.intake");
    await this.context.authorize("crm.task.create");
    if (!input.name.trim() || (!input.phone && !input.email))
      throw AppError.validation("Name and a contact channel are required.");
    return this.context.database.transaction().execute(async (database) => {
      const repository = new LeadRepository({ ...this.context, database });
      await repository.accept(input);
      const lead = await repository.lock(input.submissionUuid);
      if (!lead) throw AppError.conflict("Lead intake is unavailable.");
      if (lead.taskId === null) {
        const taskId = await createLeadFollowUp(
          database as never,
          this.context.actorEmail,
          lead.uuid,
          input.name
        );
        await repository.attachTask(lead.uuid, taskId);
      }
      return repository.getBySubmission(input.submissionUuid);
    });
  }
  async get(uuid: string) {
    await this.context.authorize("crm.lead.view");
    const record = await this.repository.get(uuid);
    if (!record) throw AppError.notFound("Lead was not found.");
    return record;
  }
  async list() {
    await this.context.authorize("crm.lead.view");
    return this.repository.list();
  }
}
export const acceptMarketingLead = (context: LeadContext, input: LeadIntake) =>
  new LeadService(context).accept(input);
