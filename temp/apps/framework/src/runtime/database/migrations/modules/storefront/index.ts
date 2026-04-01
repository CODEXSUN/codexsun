import { storefrontOrdersMigration } from './009-storefront-orders'
import { storefrontTemplatesMigration } from './010-storefront-templates'
import { storefrontRazorpayPaymentsMigration } from './011-storefront-razorpay-payments'
import { sliderThemesMigration } from './014-slider-themes'
import { defineMigrationModule } from '../../migration'

export const storefrontMigrationModule = defineMigrationModule('storefront', 'Storefront', [
  storefrontOrdersMigration,
  storefrontTemplatesMigration,
  storefrontRazorpayPaymentsMigration,
  sliderThemesMigration,
])

