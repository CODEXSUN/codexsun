import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import {
  createFrappeItem,
  getFrappeItem,
  listFrappeItemProductSyncLogs,
  listFrappeItems,
  syncFrappeItemsToProducts,
  updateFrappeItem,
} from "../../../frappe/src/services/item-service.js"
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
import {
  createFrappeTodo,
  listFrappeTodos,
  updateFrappeTodo,
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
          await readFrappeSettings(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/frappe/settings", {
      method: "PATCH",
      summary: "Save app-owned Frappe connector settings.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await saveFrappeSettings(
            context.databases.primary,
            user,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/frappe/settings/verify", {
      method: "POST",
      summary: "Verify an ERPNext connection against the current or proposed settings.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await verifyFrappeSettings(user, context.request.jsonBody)
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
          await listFrappeTodos(context.databases.primary, user)
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
