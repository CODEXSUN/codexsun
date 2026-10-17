import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { SettingsService } from "./settings.service.js";
const text = z.string().trim().max(200);
const settings = z
  .object({
    kotPrinterTarget: z.string().trim().min(1).max(200).default("system-default"),
    revision: z.number().int().nonnegative(),
    restaurantName: text,
    branchName: text,
    contactNumber: z.string().trim().max(40),
    address: z.string().trim().max(500),
    fssai: z.string().trim().max(30),
    gstin: z.string().trim().max(30),
    receiptHeader: text,
    receiptFooter: z.string().trim().max(500),
    receiptLegalNote: z.string().trim().max(500),
    currency: z.literal("INR"),
    defaultServiceType: z.enum(["POS", "TAKE AWAY"]),
    gstRate: z.union([z.literal(0), z.literal(5), z.literal(12), z.literal(18)]),
    autoPrintBill: z.boolean(),
    showOrderTabs: z.boolean(),
    showItemImages: z.boolean(),
    showItemCodes: z.boolean(),
    showSpecialLabels: z.boolean(),
    imageWriteProtection: z.boolean(),
    receiptWidth: z.enum(["58mm", "80mm"]),
    showReceiptContact: z.boolean()
  })
  .strict();
export function registerSettingsRoutes(app: FastifyInstance, dependencies: QCafeDependencies) {
  const service = new SettingsService(dependencies);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/settings",
    schemas: { response: settings },
    handler: ({ request }) => service.get(request)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/settings",
    schemas: { body: settings, response: settings },
    handler: ({ request, body }) => service.save(request, body)
  });
}
