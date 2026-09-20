import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { CreateItemAvailability } from "../contracts/menu.contract.js";
import { MenuAvailabilityRepository, type EffectiveAvailabilityInput } from "../repository/menu-availability.repository.js";
import { MenuConflictError, MenuService } from "./menu.service.js";

export class MenuUnavailableError extends Error {}

export class MenuAvailabilityService {
  constructor(
    private readonly repository: MenuAvailabilityRepository,
    private readonly menu: MenuService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(input: CreateItemAvailability, context: CommandContext) {
    if (input.endsAt && input.endsAt <= input.startsAt) throw new MenuConflictError("End time must be after start time.");
    if (!(await this.repository.scopeExists(input))) throw new MenuConflictError("The item, variant, outlet, or service channel is invalid.");
    const subjectId = await this.repository.create(input, this.now().toISOString());
    await this.activity.record(context, { eventType: "qcafe.menu.availability.created", subjectId, subjectType: "item-availability" });
    return this.menu.read(input.businessId);
  }

  async effective(input: EffectiveAvailabilityInput) {
    const rule = await this.repository.findEffective(input);
    return { available: rule?.status !== "unavailable", rule };
  }

  async assertAvailable(input: EffectiveAvailabilityInput): Promise<void> {
    const result = await this.effective(input);
    if (!result.available) throw new MenuUnavailableError(result.rule?.reason || "The item is unavailable.");
  }
}
