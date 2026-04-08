import { ecommerceSettingsSchema } from "../../shared/index.js"

export const defaultEcommerceSettings = ecommerceSettingsSchema.parse({
  id: "ecommerce-settings:default",
  automation: {
    autoSendWelcomeMail: true,
  },
  createdAt: "2026-04-08T00:00:00.000Z",
  updatedAt: "2026-04-08T00:00:00.000Z",
})
