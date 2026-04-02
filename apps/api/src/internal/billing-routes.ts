import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import { createBillingVoucher, deleteBillingVoucher, getBillingVoucher, listBillingVouchers, updateBillingVoucher } from "../../../billing/src/services/voucher-service.js"
import { createBillingCategory, deleteBillingCategory, getBillingCategory, listBillingCategories, restoreBillingCategory, updateBillingCategory } from "../../../billing/src/services/category-service.js"
import { createBillingLedger, deleteBillingLedger, getBillingLedger, listBillingLedgers, updateBillingLedger } from "../../../billing/src/services/ledger-service.js"
import { createBillingVoucherGroup, deleteBillingVoucherGroup, listBillingVoucherGroups, restoreBillingVoucherGroup, updateBillingVoucherGroup } from "../../../billing/src/services/voucher-group-service.js"
import { createBillingVoucherType, deleteBillingVoucherType, listBillingVoucherTypes, restoreBillingVoucherType, updateBillingVoucherType } from "../../../billing/src/services/voucher-type-service.js"
import { getBillingAccountingReports } from "../../../billing/src/services/reporting-service.js"
import { billingVoucherTypeSchema } from "../../../billing/shared/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createBillingInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/billing/ledgers", {
      summary: "List billing ledgers used by the posting engine.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listBillingLedgers(context.databases.primary))
      },
    }),
    defineInternalRoute("/billing/categories", {
      summary: "List billing categories for the chart and master setup.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listBillingCategories(context.databases.primary))
      },
    }),
    defineInternalRoute("/billing/voucher-groups", {
      summary: "List billing voucher groups for system setup.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listBillingVoucherGroups(context.databases.primary))
      },
    }),
    defineInternalRoute("/billing/voucher-types", {
      summary: "List billing voucher types for voucher classification setup.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listBillingVoucherTypes(context.databases.primary))
      },
    }),
    defineInternalRoute("/billing/category", {
      summary: "Read one billing category by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const categoryId = context.request.url.searchParams.get("id")

        if (!categoryId) {
          throw new ApplicationError("Billing category id is required.", {}, 400)
        }

        return jsonResponse(
          await getBillingCategory(context.databases.primary, user, categoryId)
        )
      },
    }),
    defineInternalRoute("/billing/ledger", {
      summary: "Read one billing ledger by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const ledgerId = context.request.url.searchParams.get("id")

        if (!ledgerId) {
          throw new ApplicationError("Billing ledger id is required.", {}, 400)
        }

        return jsonResponse(
          await getBillingLedger(context.databases.primary, user, ledgerId)
        )
      },
    }),
    defineInternalRoute("/billing/ledgers", {
      method: "POST",
      summary: "Create a billing ledger master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingLedger(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/billing/categories", {
      method: "POST",
      summary: "Create a billing category master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingCategory(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/billing/voucher-groups", {
      method: "POST",
      summary: "Create a billing voucher group master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingVoucherGroup(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/billing/voucher-types", {
      method: "POST",
      summary: "Create a billing voucher type master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingVoucherType(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/billing/category", {
      method: "PATCH",
      summary: "Update a billing category master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const categoryId = context.request.url.searchParams.get("id")

        if (!categoryId) {
          throw new ApplicationError("Billing category id is required.", {}, 400)
        }

        return jsonResponse(
          await updateBillingCategory(
            context.databases.primary,
            user,
            categoryId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/billing/category", {
      method: "DELETE",
      summary: "Soft delete a billing category master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const categoryId = context.request.url.searchParams.get("id")

        if (!categoryId) {
          throw new ApplicationError("Billing category id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteBillingCategory(context.databases.primary, user, categoryId)
        )
      },
    }),
    defineInternalRoute("/billing/category/restore", {
      method: "POST",
      summary: "Restore a soft-deleted billing category master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const categoryId = context.request.url.searchParams.get("id")

        if (!categoryId) {
          throw new ApplicationError("Billing category id is required.", {}, 400)
        }

        return jsonResponse(
          await restoreBillingCategory(context.databases.primary, user, categoryId)
        )
      },
    }),
    defineInternalRoute("/billing/voucher-group", {
      method: "PATCH",
      summary: "Update a billing voucher group master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherGroupId = context.request.url.searchParams.get("id")

        if (!voucherGroupId) {
          throw new ApplicationError("Billing voucher group id is required.", {}, 400)
        }

        return jsonResponse(
          await updateBillingVoucherGroup(
            context.databases.primary,
            user,
            voucherGroupId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/billing/voucher-group", {
      method: "DELETE",
      summary: "Soft delete a billing voucher group master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherGroupId = context.request.url.searchParams.get("id")

        if (!voucherGroupId) {
          throw new ApplicationError("Billing voucher group id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteBillingVoucherGroup(context.databases.primary, user, voucherGroupId)
        )
      },
    }),
    defineInternalRoute("/billing/voucher-group/restore", {
      method: "POST",
      summary: "Restore a soft-deleted billing voucher group master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherGroupId = context.request.url.searchParams.get("id")

        if (!voucherGroupId) {
          throw new ApplicationError("Billing voucher group id is required.", {}, 400)
        }

        return jsonResponse(
          await restoreBillingVoucherGroup(context.databases.primary, user, voucherGroupId)
        )
      },
    }),
    defineInternalRoute("/billing/voucher-type", {
      method: "PATCH",
      summary: "Update a billing voucher type master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherTypeId = context.request.url.searchParams.get("id")

        if (!voucherTypeId) {
          throw new ApplicationError("Billing voucher type id is required.", {}, 400)
        }

        return jsonResponse(
          await updateBillingVoucherType(
            context.databases.primary,
            user,
            voucherTypeId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/billing/voucher-type", {
      method: "DELETE",
      summary: "Soft delete a billing voucher type master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherTypeId = context.request.url.searchParams.get("id")

        if (!voucherTypeId) {
          throw new ApplicationError("Billing voucher type id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteBillingVoucherType(context.databases.primary, user, voucherTypeId)
        )
      },
    }),
    defineInternalRoute("/billing/voucher-type/restore", {
      method: "POST",
      summary: "Restore a soft-deleted billing voucher type master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherTypeId = context.request.url.searchParams.get("id")

        if (!voucherTypeId) {
          throw new ApplicationError("Billing voucher type id is required.", {}, 400)
        }

        return jsonResponse(
          await restoreBillingVoucherType(context.databases.primary, user, voucherTypeId)
        )
      },
    }),
    defineInternalRoute("/billing/ledger", {
      method: "PATCH",
      summary: "Update a billing ledger master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const ledgerId = context.request.url.searchParams.get("id")

        if (!ledgerId) {
          throw new ApplicationError("Billing ledger id is required.", {}, 400)
        }

        return jsonResponse(
          await updateBillingLedger(
            context.databases.primary,
            user,
            ledgerId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/billing/ledger", {
      method: "DELETE",
      summary: "Delete a billing ledger master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const ledgerId = context.request.url.searchParams.get("id")

        if (!ledgerId) {
          throw new ApplicationError("Billing ledger id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteBillingLedger(context.databases.primary, user, ledgerId)
        )
      },
    }),
    defineInternalRoute("/billing/vouchers", {
      summary: "List billing vouchers with double-entry lines.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const typeParam = context.request.url.searchParams.get("type")

        return jsonResponse(
          await listBillingVouchers(
            context.databases.primary,
            user,
            typeParam ? billingVoucherTypeSchema.parse(typeParam) : undefined
          )
        )
      },
    }),
    defineInternalRoute("/billing/reports", {
      summary: "Return billing-derived accounts reports from posted vouchers and ledgers.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await getBillingAccountingReports(context.databases.primary, user)
        )
      },
    }),
    defineInternalRoute("/billing/voucher", {
      summary: "Read one billing voucher by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherId = context.request.url.searchParams.get("id")

        if (!voucherId) {
          throw new ApplicationError("Billing voucher id is required.", {}, 400)
        }

        return jsonResponse(
          await getBillingVoucher(context.databases.primary, user, voucherId)
        )
      },
    }),
    defineInternalRoute("/billing/vouchers", {
      method: "POST",
      summary: "Create and post a billing voucher.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingVoucher(
            context.databases.primary,
            user,
            context.config,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/billing/voucher", {
      method: "PATCH",
      summary: "Update a billing voucher and revalidate posting balance.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherId = context.request.url.searchParams.get("id")

        if (!voucherId) {
          throw new ApplicationError("Billing voucher id is required.", {}, 400)
        }

        return jsonResponse(
          await updateBillingVoucher(
            context.databases.primary,
            user,
            context.config,
            voucherId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/billing/voucher", {
      method: "DELETE",
      summary: "Delete a billing voucher.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const voucherId = context.request.url.searchParams.get("id")

        if (!voucherId) {
          throw new ApplicationError("Billing voucher id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteBillingVoucher(context.databases.primary, user, voucherId)
        )
      },
    }),
  ]
}
