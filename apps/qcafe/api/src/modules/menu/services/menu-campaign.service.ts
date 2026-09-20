import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  CreateSpecialCampaign,
  CreateSpecialPrice,
  EffectiveCampaignPrice,
  EffectiveSaleabilityInput,
} from "../contracts/menu.contract.js";
import { MenuCampaignRepository } from "../repository/menu-campaign.repository.js";
import { MenuConflictError, MenuService } from "./menu.service.js";

export class MenuCampaignService {
  constructor(
    private readonly repository: MenuCampaignRepository,
    private readonly menu: MenuService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createCampaign(input: CreateSpecialCampaign, context: CommandContext) {
    if (input.endsAt <= input.startsAt) throw new MenuConflictError("Campaign end time must be after its start time.");
    if (input.scope === "business" && input.locationId)
      throw new MenuConflictError("A business campaign cannot select one outlet.");
    if (input.scope === "location" && !input.locationId)
      throw new MenuConflictError("A location campaign requires an outlet.");
    if (!(await this.repository.campaignScopeExists(input)))
      throw new MenuConflictError("The campaign business or outlet is invalid.");
    const subjectId = await this.repository.createCampaign(input, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.menu.special-campaign.created",
      subjectId,
      subjectType: "special-campaign",
    });
    return this.menu.read(input.businessId);
  }

  async createSpecialPrice(input: CreateSpecialPrice, context: CommandContext) {
    const ruleCount = Number(input.amountMinor !== undefined) + Number(input.discountBasisPoints !== undefined);
    if (ruleCount !== 1) throw new MenuConflictError("Set either an amount or a discount, but not both.");
    if (input.amountMinor !== undefined && input.amountMinor < 0)
      throw new MenuConflictError("Campaign amount cannot be negative.");
    if (
      input.discountBasisPoints !== undefined &&
      (input.discountBasisPoints < 1 || input.discountBasisPoints > 10_000)
    ) {
      throw new MenuConflictError("Campaign discount must be between 0.01% and 100%.");
    }
    if (input.usageLimit !== undefined && input.usageLimit < 1)
      throw new MenuConflictError("Campaign usage limit must be positive.");
    if (!(await this.repository.specialPriceScopeExists(input)))
      throw new MenuConflictError("The campaign, item, or variant is invalid.");
    if (await this.repository.specialPriceExists(input))
      throw new MenuConflictError("This campaign already has a price for the item or variant.");
    const subjectId = await this.repository.createSpecialPrice(input, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.menu.special-price.created",
      subjectId,
      subjectType: "special-price",
    });
    return this.menu.read(input.businessId);
  }

  async effective(input: EffectiveSaleabilityInput): Promise<EffectiveCampaignPrice> {
    const basePrice = await this.menu.findEffectivePrice({
      businessDate: input.at.slice(0, 10),
      itemId: input.itemId,
      locationId: input.locationId,
      priceBookId: input.priceBookId,
      serviceChannelId: input.serviceChannelId,
      variantId: input.variantId,
    });
    if (!basePrice)
      return { amountMinor: null, basePrice: null, campaign: null, source: "unpriced", specialPrice: null };
    const effectiveSpecial = await this.repository.findEffective(input);
    if (!effectiveSpecial)
      return { amountMinor: basePrice.amountMinor, basePrice, campaign: null, source: "normal", specialPrice: null };
    const specialPrice = effectiveSpecial.specialPrice;
    const amountMinor =
      specialPrice.amountMinor ??
      Math.round((basePrice.amountMinor * (10_000 - specialPrice.discountBasisPoints!)) / 10_000);
    return { amountMinor, basePrice, campaign: effectiveSpecial.campaign, source: "campaign", specialPrice };
  }
}
