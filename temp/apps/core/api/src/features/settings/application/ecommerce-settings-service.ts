import {
  ecommercePricingSettingsResponseSchema,
  ecommercePricingSettingsUpdatePayloadSchema,
  type AuthUser,
  type EcommercePricingSettingsUpdatePayload,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import {
  environment,
  reloadEnvironment,
  updateEnvironmentFile,
} from '@framework-core/runtime/config/environment'

function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }
}

function normalizePayload(payload: unknown): EcommercePricingSettingsUpdatePayload {
  const parsedPayload = ecommercePricingSettingsUpdatePayloadSchema.parse(payload)

  return {
    purchaseToSellPercent: Number(parsedPayload.purchaseToSellPercent),
    purchaseToMrpPercent: Number(parsedPayload.purchaseToMrpPercent),
  }
}

function getEcommerceSettings() {
  return ecommercePricingSettingsResponseSchema.parse({
    settings: {
      purchaseToSellPercent: environment.ecommerce.pricing.purchaseToSellPercent,
      purchaseToMrpPercent: environment.ecommerce.pricing.purchaseToMrpPercent,
    },
  })
}

export function readEcommerceSettings(user: AuthUser) {
  assertSuperAdmin(user)
  return getEcommerceSettings()
}

export function saveEcommerceSettings(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const settings = normalizePayload(payload)
  updateEnvironmentFile({
    ECOMMERCE_PRICE_PURCHASE_TO_SELL_PERCENT: String(settings.purchaseToSellPercent),
    ECOMMERCE_PRICE_PURCHASE_TO_MRP_PERCENT: String(settings.purchaseToMrpPercent),
  })
  reloadEnvironment()

  return getEcommerceSettings()
}
