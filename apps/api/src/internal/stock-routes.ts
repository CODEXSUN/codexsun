import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import {
  billingStockAcceptancePayloadSchema,
  stockAvailabilityRequestSchema,
  stockReservationUpsertPayloadSchema,
  stockTransferUpsertPayloadSchema,
} from "../../../stock/shared/index.js"
import {
  acceptStockUnitsToInventory,
  createStockGoodsInward,
  createStockDeliveryNote,
  createStockPurchaseReceipt,
  createStockPurchaseReceiptBarcodeBatch,
  deleteStockPurchaseReceipt,
  createStockSaleAllocation,
  getStockBarcodeAlias,
  getStockGoodsInward,
  getStockDeliveryNote,
  getStockPurchaseReceipt,
  getStockPurchaseReceiptLookups,
  getStockReconciliation,
  getStockUnit,
  listStockAcceptanceVerifications,
  getStockVerificationSummary,
  listStockAvailability,
  listStockBarcodeAliases,
  listStockGoodsInward,
  listStockDeliveryNotes,
  listStockMovements,
  listStockPurchaseReceipts,
  listStockReservations,
  listStockSaleAllocations,
  listStockTransfers,
  listStockUnits,
  postStockGoodsInward,
  rollbackStockPurchaseReceiptBarcodes,
  resolveStockBarcode,
  updateStockGoodsInward,
  updateStockDeliveryNote,
  updateStockPurchaseReceipt,
  upsertStockReservation,
  upsertStockTransfer,
} from "../../../stock/src/services/stock-manager-service.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createStockInternalRoutes(): HttpRouteDefinition[] {
  const requireStockWorkspaceView = (
    context: Parameters<typeof requireAuthenticatedUser>[0]
  ) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["billing:workspace:view"],
    })

  const requireStockWorkspaceManage = (
    context: Parameters<typeof requireAuthenticatedUser>[0]
  ) =>
    requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin", "staff"],
      requiredPermissionKeys: ["billing:workspace:view", "billing:vouchers:manage"],
    })

  return [
    defineInternalRoute("/stock/purchase-receipts", {
      summary: "List operational stock purchase receipts.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await listStockPurchaseReceipts(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/purchase-receipt", {
      summary: "Read one stock purchase receipt by id.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError("Stock purchase receipt id is required.", {}, 400)
        }

        return jsonResponse(
          await getStockPurchaseReceipt(context.databases.primary, user, receiptId)
        )
      },
    }),
    defineInternalRoute("/stock/purchase-receipts", {
      method: "POST",
      summary: "Create a stock purchase receipt.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        return jsonResponse(
          await createStockPurchaseReceipt(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/purchase-receipt", {
      method: "PATCH",
      summary: "Update a stock purchase receipt.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError("Stock purchase receipt id is required.", {}, 400)
        }

        return jsonResponse(
          await updateStockPurchaseReceipt(
            context.databases.primary,
            user,
            receiptId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/stock/purchase-receipt/barcodes", {
      method: "POST",
      summary: "Generate serialized stock units and barcode stickers from a purchase receipt.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError("Stock purchase receipt id is required.", {}, 400)
        }

        return jsonResponse(
          await createStockPurchaseReceiptBarcodeBatch(
            context.databases.primary,
            user,
            receiptId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/stock/purchase-receipt/barcodes", {
      method: "DELETE",
      summary: "Delete selected generated stock units and barcode stickers from a purchase receipt.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError("Stock purchase receipt id is required.", {}, 400)
        }

        return jsonResponse(
          await rollbackStockPurchaseReceiptBarcodes(
            context.databases.primary,
            user,
            receiptId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/stock/purchase-receipt", {
      method: "DELETE",
      summary: "Delete a stock purchase receipt.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError("Stock purchase receipt id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteStockPurchaseReceipt(context.databases.primary, user, receiptId)
        )
      },
    }),
    defineInternalRoute("/stock/goods-inward", {
      summary: "List stock goods inward records.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await listStockGoodsInward(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/goods-inward-note", {
      summary: "Read one stock goods inward record by id.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        const inwardId = context.request.url.searchParams.get("id")

        if (!inwardId) {
          throw new ApplicationError("Stock goods inward id is required.", {}, 400)
        }

        return jsonResponse(
          await getStockGoodsInward(context.databases.primary, user, inwardId)
        )
      },
    }),
    defineInternalRoute("/stock/goods-inward", {
      method: "POST",
      summary: "Create a stock goods inward record.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        return jsonResponse(
          await createStockGoodsInward(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/goods-inward-note", {
      method: "PATCH",
      summary: "Update a stock goods inward record.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const inwardId = context.request.url.searchParams.get("id")

        if (!inwardId) {
          throw new ApplicationError("Stock goods inward id is required.", {}, 400)
        }

        return jsonResponse(
          await updateStockGoodsInward(
            context.databases.primary,
            user,
            inwardId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/stock/goods-inward-note/post", {
      method: "POST",
      summary: "Post one verified stock goods inward record into inventory.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const inwardId = context.request.url.searchParams.get("id")

        if (!inwardId) {
          throw new ApplicationError("Stock goods inward id is required.", {}, 400)
        }

        return jsonResponse(
          await postStockGoodsInward(context.databases.primary, user, inwardId)
        )
      },
    }),
    defineInternalRoute("/stock/stock-units", {
      summary: "List stock units.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await listStockUnits(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/delivery-notes", {
      summary: "List stock delivery notes.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await listStockDeliveryNotes(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/delivery-note", {
      summary: "Read one stock delivery note by id.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        const deliveryNoteId = context.request.url.searchParams.get("id")

        if (!deliveryNoteId) {
          throw new ApplicationError("Stock delivery note id is required.", {}, 400)
        }

        return jsonResponse(
          await getStockDeliveryNote(context.databases.primary, user, deliveryNoteId)
        )
      },
    }),
    defineInternalRoute("/stock/delivery-notes", {
      method: "POST",
      summary: "Create a stock delivery note.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        return jsonResponse(
          await createStockDeliveryNote(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/delivery-note", {
      method: "PATCH",
      summary: "Update a stock delivery note.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        const deliveryNoteId = context.request.url.searchParams.get("id")

        if (!deliveryNoteId) {
          throw new ApplicationError("Stock delivery note id is required.", {}, 400)
        }

        return jsonResponse(
          await updateStockDeliveryNote(
            context.databases.primary,
            user,
            deliveryNoteId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/stock/stock-acceptance-verifications", {
      summary: "List stock acceptance verification records.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(
          await listStockAcceptanceVerifications(context.databases.primary, user, {
            purchaseReceiptId: context.request.url.searchParams.get("purchaseReceiptId") ?? undefined,
            productId: context.request.url.searchParams.get("productId") ?? undefined,
            status:
              (context.request.url.searchParams.get("status") as
                | "verified"
                | "mismatch"
                | "rejected"
                | null) ?? undefined,
          })
        )
      },
    }),
    defineInternalRoute("/stock/stock-acceptance", {
      method: "POST",
      summary: "Accept verified temporary stock units into live stock.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        return jsonResponse(
          await acceptStockUnitsToInventory(
            context.databases.primary,
            user,
            billingStockAcceptancePayloadSchema.parse(context.request.jsonBody)
          )
        )
      },
    }),
    defineInternalRoute("/stock/stock-unit", {
      summary: "Read one stock unit by id.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        const stockUnitId = context.request.url.searchParams.get("id")

        if (!stockUnitId) {
          throw new ApplicationError("Stock unit id is required.", {}, 400)
        }

        return jsonResponse(await getStockUnit(context.databases.primary, user, stockUnitId))
      },
    }),
    defineInternalRoute("/stock/barcode-aliases", {
      summary: "List stock barcode aliases.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await listStockBarcodeAliases(context.databases.primary))
      },
    }),
    defineInternalRoute("/stock/barcode-alias", {
      summary: "Read one stock barcode alias by id.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        const barcodeAliasId = context.request.url.searchParams.get("id")

        if (!barcodeAliasId) {
          throw new ApplicationError("Stock barcode alias id is required.", {}, 400)
        }

        return jsonResponse(await getStockBarcodeAlias(context.databases.primary, barcodeAliasId))
      },
    }),
    defineInternalRoute("/stock/barcode/resolve", {
      method: "POST",
      summary: "Resolve a barcode against stock units.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(
          await resolveStockBarcode(context.databases.primary, user, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/stock/sale-allocations", {
      summary: "List stock sale allocations.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await listStockSaleAllocations(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/sale-allocations", {
      method: "POST",
      summary: "Create a stock sale allocation.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceManage(context)
        return jsonResponse(
          await createStockSaleAllocation(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/movements", {
      summary: "List inventory-engine stock movements.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await listStockMovements(context.databases.primary))
      },
    }),
    defineInternalRoute("/stock/availability", {
      method: "POST",
      summary: "Project real-time stock availability.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(
          await listStockAvailability(
            context.databases.primary,
            stockAvailabilityRequestSchema.parse(context.request.jsonBody ?? {})
          )
        )
      },
    }),
    defineInternalRoute("/stock/transfers", {
      summary: "List warehouse transfers.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await listStockTransfers(context.databases.primary))
      },
    }),
    defineInternalRoute("/stock/transfers", {
      method: "POST",
      summary: "Create or update a warehouse transfer.",
      handler: async (context) => {
        await requireStockWorkspaceManage(context)
        return jsonResponse(
          await upsertStockTransfer(
            context.databases.primary,
            stockTransferUpsertPayloadSchema.parse(context.request.jsonBody)
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/reservations", {
      summary: "List stock reservations.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await listStockReservations(context.databases.primary))
      },
    }),
    defineInternalRoute("/stock/reservations", {
      method: "POST",
      summary: "Create or update a stock reservation.",
      handler: async (context) => {
        await requireStockWorkspaceManage(context)
        return jsonResponse(
          await upsertStockReservation(
            context.databases.primary,
            stockReservationUpsertPayloadSchema.parse(context.request.jsonBody)
          ),
          201
        )
      },
    }),
    defineInternalRoute("/stock/reconciliation", {
      summary: "Compare inventory-engine and core stock totals.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await getStockReconciliation(context.databases.primary))
      },
    }),
    defineInternalRoute("/stock/verifications", {
      summary: "Return stock verification readiness summary.",
      handler: async (context) => {
        const { user } = await requireStockWorkspaceView(context)
        return jsonResponse(await getStockVerificationSummary(context.databases.primary, user))
      },
    }),
    defineInternalRoute("/stock/lookups", {
      summary: "Return stock module lookup values for upsert forms.",
      handler: async (context) => {
        await requireStockWorkspaceView(context)
        return jsonResponse(await getStockPurchaseReceiptLookups(context.databases.primary))
      },
    }),
  ]
}
