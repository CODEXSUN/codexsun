import { AppError } from "@codexsun/framework/errors";
import type { CallLogFilters, CallLogInput } from "./call-log.types.js";
import { CallLogRepository } from "./call-log.repository.js";

export const callTypes = ["Incoming", "Outgoing"] as const;
export const callStatuses = [
  "Initiated",
  "Ringing",
  "In Progress",
  "Completed",
  "Failed",
  "Busy",
  "No Answer",
  "Queued",
  "Canceled"
] as const;

export class CallLogService {
  constructor(
    private readonly repository: CallLogRepository,
    private readonly actorEmail: string
  ) {}

  list(filters: CallLogFilters) {
    return this.repository.list(filters);
  }
  users(search: string) {
    return this.repository.users(search);
  }

  create(input: CallLogInput) {
    if (
      !callTypes.includes(input.type) ||
      !callStatuses.includes(input.status as (typeof callStatuses)[number])
    )
      throw AppError.validation("Select a valid call type and status.");
    if (!input.from.trim() || !input.to.trim())
      throw AppError.validation("Enter the caller and recipient.");
    return this.repository.create(input, this.actorEmail);
  }

  listComments(id: number) {
    return this.repository.listComments(id);
  }

  addComment(id: number, body: string) {
    const text = body.trim();
    if (!text) throw AppError.validation("Enter a comment.");
    return this.repository.addComment(id, text, this.actorEmail);
  }
}
