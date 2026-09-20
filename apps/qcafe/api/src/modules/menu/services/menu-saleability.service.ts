import type { EffectiveSaleability, EffectiveSaleabilityInput, SaleabilityReason } from "../contracts/menu.contract.js";
import { MenuSaleabilityRepository } from "../repository/menu-saleability.repository.js";
import { MenuAvailabilityService } from "./menu-availability.service.js";
import { MenuCampaignService } from "./menu-campaign.service.js";

export class MenuNotSaleableError extends Error {
  constructor(readonly result: EffectiveSaleability) {
    super(`The menu item is not saleable: ${result.reasons.join(", ")}.`);
  }
}

export class MenuSaleabilityService {
  constructor(
    private readonly repository: MenuSaleabilityRepository,
    private readonly availability: MenuAvailabilityService,
    private readonly campaigns: MenuCampaignService,
  ) {}

  async effective(input: EffectiveSaleabilityInput): Promise<EffectiveSaleability> {
    const scope = await this.repository.inspect(input);
    const reasons: SaleabilityReason[] = [];
    if (!scope.itemFound) reasons.push("item_not_found");
    else {
      if (!scope.itemActive) reasons.push("item_inactive");
      if (!scope.categoryActive) reasons.push("category_inactive");
    }
    if (!scope.variantValid) reasons.push("variant_invalid");
    else if (!scope.variantActive) reasons.push("variant_inactive");
    if (!scope.locationValid) reasons.push("location_invalid");
    if (!scope.channelValid) reasons.push("channel_invalid");
    if (!scope.priceBookEligible) reasons.push("price_book_ineligible");

    const canResolve = scope.itemFound && scope.variantValid && scope.locationValid && scope.channelValid;
    const pricing =
      canResolve && scope.priceBookEligible
        ? await this.campaigns.effective(input)
        : { amountMinor: null, basePrice: null, campaign: null, source: "unpriced" as const, specialPrice: null };
    if (canResolve && scope.priceBookEligible && !pricing.basePrice) reasons.push("price_missing");

    const availability = canResolve
      ? await this.availability.effective({
          at: input.at,
          itemId: input.itemId,
          locationId: input.locationId,
          serviceChannelId: input.serviceChannelId,
          variantId: input.variantId,
        })
      : { available: false, rule: null };
    if (canResolve && !availability.available) reasons.push("item_unavailable");
    if (scope.invalidModifierGroupIds.length) reasons.push("modifier_configuration_invalid");

    return {
      availableRule: availability.rule,
      campaign: pricing.campaign,
      effectiveAmountMinor: pricing.amountMinor,
      invalidModifierGroupIds: scope.invalidModifierGroupIds,
      price: pricing.basePrice,
      reasons,
      saleable: reasons.length === 0,
      specialPrice: pricing.specialPrice,
    };
  }

  async assertSaleable(input: EffectiveSaleabilityInput): Promise<EffectiveSaleability> {
    const result = await this.effective(input);
    if (!result.saleable) throw new MenuNotSaleableError(result);
    return result;
  }
}
