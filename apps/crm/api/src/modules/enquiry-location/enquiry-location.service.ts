import { AppError } from "@codexsun/framework/errors";
import type { EnquiryLocationRepository } from "./enquiry-location.repository.js";
import type { CreateEnquiryLocation } from "./enquiry-location.types.js";

export type EnquiryLocationAccess = {
  assignedUserId: number | null;
  createdBy: string;
};

export class EnquiryLocationService {
  constructor(
    private readonly repository: EnquiryLocationRepository,
    private readonly actorEmail: string,
    private readonly actorUserId: number | null,
    private readonly canViewAll: boolean
  ) {}

  async list(enquiryId: number, enquiry: EnquiryLocationAccess) {
    this.assertAccess(enquiry, false);
    return this.repository.list(enquiryId);
  }

  async create(
    enquiryId: number,
    contactId: number | null,
    enquiry: EnquiryLocationAccess,
    input: CreateEnquiryLocation
  ) {
    this.assertAccess(enquiry, true);
    return this.repository.create(enquiryId, contactId, input, this.actorEmail);
  }

  private assertAccess(enquiry: EnquiryLocationAccess, requireAssignment: boolean) {
    if (this.canViewAll) return;
    if (
      requireAssignment &&
      this.actorUserId !== null &&
      enquiry.assignedUserId === this.actorUserId
    )
      return;
    if (
      !requireAssignment &&
      this.actorUserId !== null &&
      enquiry.assignedUserId === this.actorUserId
    )
      return;
    if (!requireAssignment && enquiry.createdBy.toLowerCase() === this.actorEmail.toLowerCase())
      return;
    throw AppError.forbidden(
      requireAssignment
        ? "You can log a location only for an enquiry assigned to you."
        : "You cannot view locations for this enquiry."
    );
  }
}
