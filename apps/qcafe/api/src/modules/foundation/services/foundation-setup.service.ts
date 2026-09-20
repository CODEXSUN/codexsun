import type {
  CreateBusinessSetup,
  CreateLocation,
  FoundationSetupResponse,
} from "../contracts/foundation-setup.contract.js";
import type { ActivityRecorder, CommandContext } from "../contracts/activity.contract.js";
import type { QcafePersistenceConfiguration } from "../persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../repository/foundation-setup.repository.js";

export class FoundationSetupConflictError extends Error {}

export class FoundationSetupService {
  constructor(
    private readonly repository: FoundationSetupRepository,
    private readonly configuration: QcafePersistenceConfiguration,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async read(): Promise<FoundationSetupResponse> {
    return {
      businesses: await this.repository.list(),
      dataMode: this.configuration.mode,
      syncConfigured: Boolean(this.configuration.syncCloudUrl),
    };
  }

  async createBusiness(input: CreateBusinessSetup, context: CommandContext): Promise<FoundationSetupResponse> {
    const id = await this.repository.createBusiness(input, this.now().toISOString());
    await this.activity.record(context, { eventType: "qcafe.foundation.business.created", subjectId: id, subjectType: "business" });
    return this.read();
  }

  async createLocation(input: CreateLocation, context: CommandContext): Promise<FoundationSetupResponse> {
    if (!(await this.repository.businessExists(input.businessId))) {
      throw new FoundationSetupConflictError("The business does not exist.");
    }
    try {
      const id = await this.repository.createLocation(input, this.now().toISOString());
      await this.activity.record(context, { eventType: "qcafe.foundation.location.created", subjectId: id, subjectType: "location" });
    } catch {
      throw new FoundationSetupConflictError("This outlet code already exists for the business.");
    }
    return this.read();
  }

  async openBusinessDay(locationId: string, businessDate: string, context: CommandContext): Promise<FoundationSetupResponse> {
    if (!(await this.repository.locationExists(locationId))) {
      throw new FoundationSetupConflictError("The outlet does not exist.");
    }
    try {
      const id = await this.repository.openBusinessDay(locationId, businessDate, this.now().toISOString());
      await this.activity.record(context, { eventType: "qcafe.foundation.business-day.opened", subjectId: id, subjectType: "business-day", payload: { businessDate, locationId } });
    } catch {
      throw new FoundationSetupConflictError("This location already has a business day for that date.");
    }
    return this.read();
  }
}
