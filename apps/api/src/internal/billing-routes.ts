import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import { createBillingVoucher, deleteBillingVoucher, getBillingVoucher, listBillingVouchers, updateBillingVoucher } from "../../../billing/src/services/voucher-service.js"
import { createBillingLedgerGroup, listBillingLedgerGroups } from "../../../billing/src/services/ledger-group-service.js"
import { createBillingLedger, deleteBillingLedger, getBillingLedger, listBillingLedgers, updateBillingLedger } from "../../../billing/src/services/ledger-service.js"
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
    defineInternalRoute("/billing/ledger-groups", {
      summary: "List billing ledger groups for the chart and master setup.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listBillingLedgerGroups(context.databases.primary))
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
    defineInternalRoute("/billing/ledger-groups", {
      method: "POST",
      summary: "Create a billing ledger group master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createBillingLedgerGroup(
            context.databases.primary,
            user,
            context.request.jsonBody
          ),
          201
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
