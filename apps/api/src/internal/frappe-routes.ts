import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { writeFrameworkActivityFromContext } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import { resolveRuntimeSettingsRoot } from "../../../framework/src/runtime/config/runtime-settings-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import {
  createFrappeItem,
  getFrappeItem,
  listFrappeItemProductSyncLogs,
  listFrappeItems,
  pullFrappeItemsLive,
  syncFrappeItemsToProducts,
  updateFrappeItem,
} from "../../../frappe/src/services/item-service.js"
import { readFrappeCustomerCommercialProfileContract } from "../../../frappe/src/services/customer-commercial-profile-contract-service.js"
import { readFrappeItemProjectionContract } from "../../../frappe/src/services/item-projection-contract-service.js"
import { readFrappePriceProjectionContract } from "../../../frappe/src/services/price-projection-contract-service.js"
import { readFrappeSalesOrderPushPolicy } from "../../../frappe/src/services/sales-order-policy-service.js"
import { readFrappeStockProjectionContract } from "../../../frappe/src/services/stock-projection-contract-service.js"
import {
  readFrappeTransactionReconciliationQueue,
  replayFrappeTransactionSync,
  syncFrappeDeliveryNoteToEcommerce,
  syncFrappeInvoiceToEcommerce,
  syncFrappeReturnToEcommerce,
} from "../../../frappe/src/services/transaction-sync-service.js"
import {
  getFrappePurchaseReceipt,
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from "../../../frappe/src/services/purchase-receipt-service.js"
import {
  readFrappeSettings,
  saveFrappeSettings,
  verifyFrappeSettings,
} from "../../../frappe/src/services/settings-service.js"
import { readFrappeSyncPolicy } from "../../../frappe/src/services/sync-policy-service.js"
import { readFrappeObservabilityReport } from "../../../frappe/src/services/observability-service.js"
import {
  createFrappeTodo,
  deleteFrappeTodos,
  listFrappeTodos,
  syncFrappeTodosLive,
  updateFrappeTodo,
  verifyFrappeTodosSync,
} from "../../../frappe/src/services/todo-service.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createFrappeInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/frappe/settings", {
      summary: "Read app-owned Frappe connector settings.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeSettings(context.databases.primary, user, {
            cwd: resolveRuntimeSettingsRoot(context.config),
          })
        )
      },
    }),
    defineInternalRoute("/frappe/settings", {
      method: "PATCH",
      summary: "Save only the Frappe ERPNext env contract back into the runtime .env file.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const response = await saveFrappeSettings(
          context.databases.primary,
          user,
          context.request.jsonBody,
          {
            cwd: resolveRuntimeSettingsRoot(context.config),
          }
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "frappe",
          action: "frappe-settings.save",
          message: "Frappe env contract was updated from the connector workspace.",
          details: {
            baseUrl: response.settings.baseUrl,
            siteName: response.settings.siteName,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/frappe/settings/verify", {
      method: "POST",
      summary: "Verify the current env-backed ERPNext connection against the live endpoint.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await verifyFrappeSettings(context.databases.primary, user, undefined, {
            cwd: resolveRuntimeSettingsRoot(context.config),
          })
        )
      },
    }),
    defineInternalRoute("/frappe/sync-policy", {
      summary: "Read the production-safe retry, timeout, and failure policy for connector syncs.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeSyncPolicy(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/observability", {
      summary: "Read connector monitoring and recent exception history for Frappe operations.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeObservabilityReport(
            context.databases.primary,
            context.config,
            user
          )
        )
      },
    }),
    defineInternalRoute("/frappe/sales-order-push-policy", {
      summary: "Read the approval and retry rules for pushing paid ecommerce orders into ERPNext Sales Order.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeSalesOrderPushPolicy(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/transactions/reconciliation-queue", {
      summary: "Read ERP transaction mismatches and replay-ready items for ecommerce order sync-back flows.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeTransactionReconciliationQueue(
            context.databases.primary,
            user
          )
        )
      },
    }),
    defineInternalRoute("/frappe/transactions/replay", {
      method: "POST",
      summary: "Replay a queued ERP transaction sync item back into ecommerce.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await replayFrappeTransactionSync(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/transactions/delivery-note", {
      method: "POST",
      summary: "Sync ERP delivery-note and shipment references back into ecommerce orders.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappeDeliveryNoteToEcommerce(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/transactions/invoice", {
      method: "POST",
      summary: "Sync ERP invoice references back into ecommerce orders.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappeInvoiceToEcommerce(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/transactions/return", {
      method: "POST",
      summary: "Sync ERP return and refund states back into ecommerce orders.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappeReturnToEcommerce(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/contracts/item-projection", {
      summary: "Read the authoritative ERP item snapshot to core product projection contract.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await readFrappeItemProjectionContract(user))
      },
    }),
    defineInternalRoute("/frappe/contracts/price-projection", {
      summary: "Read the authoritative ERP price-list snapshot to core commerce-pricing projection contract.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await readFrappePriceProjectionContract(user))
      },
    }),
    defineInternalRoute("/frappe/contracts/stock-projection", {
      summary: "Read the authoritative ERP warehouse and stock snapshot to core storefront-availability projection contract.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await readFrappeStockProjectionContract(user))
      },
    }),
    defineInternalRoute("/frappe/contracts/customer-commercial-profile", {
      summary: "Read the authoritative ERP customer-group and commercial-profile enrichment contract.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await readFrappeCustomerCommercialProfileContract(user)
        )
      },
    }),
    defineInternalRoute("/frappe/todos", {
      summary: "List app-owned Frappe todo snapshots.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await listFrappeTodos(context.databases.primary, user, {
            cwd: resolveRuntimeSettingsRoot(context.config),
          })
        )
      },
    }),
    defineInternalRoute("/frappe/todos", {
      method: "POST",
      summary: "Create a Frappe todo snapshot.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createFrappeTodo(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/frappe/todos", {
      method: "PATCH",
      summary: "Update a Frappe todo snapshot.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const todoId = context.request.url.searchParams.get("id")

        if (!todoId) {
          throw new ApplicationError("Frappe ToDo id is required.", {}, 400)
        }

        return jsonResponse(
          await updateFrappeTodo(
            context.databases.primary,
            user,
            todoId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/todos", {
      method: "DELETE",
      summary: "Delete selected local Frappe todo snapshots.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await deleteFrappeTodos(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/todos/sync-live", {
      method: "POST",
      summary: "Live sync Frappe ToDo snapshots to and from ERPNext.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappeTodosLive(
            context.databases.primary,
            user,
            context.request.jsonBody,
            {
              cwd: resolveRuntimeSettingsRoot(context.config),
            }
          )
        )
      },
    }),
    defineInternalRoute("/frappe/todos/verify-sync", {
      method: "POST",
      summary: "Verify local Frappe ToDo snapshots against ERPNext.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await verifyFrappeTodosSync(
            context.databases.primary,
            user,
            {
              cwd: resolveRuntimeSettingsRoot(context.config),
            }
          )
        )
      },
    }),
    defineInternalRoute("/frappe/items", {
      summary: "List app-owned Frappe item snapshots and references.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await listFrappeItems(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/item", {
      summary: "Read one Frappe item snapshot by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const itemId = context.request.url.searchParams.get("id")

        if (!itemId) {
          throw new ApplicationError("Frappe item id is required.", {}, 400)
        }

        return jsonResponse(
          await getFrappeItem(context.databases.primary, user, itemId)
        )
      },
    }),
    defineInternalRoute("/frappe/items", {
      method: "POST",
      summary: "Create a Frappe item snapshot.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createFrappeItem(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/frappe/item", {
      method: "PATCH",
      summary: "Update a Frappe item snapshot.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const itemId = context.request.url.searchParams.get("id")

        if (!itemId) {
          throw new ApplicationError("Frappe item id is required.", {}, 400)
        }

        return jsonResponse(
          await updateFrappeItem(
            context.databases.primary,
            user,
            itemId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/items/sync-logs", {
      summary: "List item-to-product sync logs.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await listFrappeItemProductSyncLogs(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/items/sync-products", {
      method: "POST",
      summary: "Sync selected Frappe items into ecommerce products.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappeItemsToProducts(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/items/pull-live", {
      method: "POST",
      summary: "Pull live ERPNext items into app-owned Frappe product snapshots.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await pullFrappeItemsLive(
            context.databases.primary,
            user,
            {
              cwd: resolveRuntimeSettingsRoot(context.config),
            }
          )
        )
      },
    }),
    defineInternalRoute("/frappe/purchase-receipts", {
      summary: "List app-owned Frappe purchase receipt snapshots.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await listFrappePurchaseReceipts(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/purchase-receipt", {
      summary: "Read one Frappe purchase receipt snapshot by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const receiptId = context.request.url.searchParams.get("id")

        if (!receiptId) {
          throw new ApplicationError(
            "Frappe purchase receipt id is required.",
            {},
            400
          )
        }

        return jsonResponse(
          await getFrappePurchaseReceipt(
            context.databases.primary,
            user,
            receiptId
          )
        )
      },
    }),
    defineInternalRoute("/frappe/purchase-receipts/sync", {
      method: "POST",
      summary: "Sync selected purchase receipts into local connector snapshots.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await syncFrappePurchaseReceipts(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
  ]
}
