import type { Kysely } from "kysely"

import { createMailboxService } from "../../../cxapp/src/services/service-factory.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { asQueryDatabase } from "../../../cxapp/src/data/query-database.js"
import { cxappTableNames } from "../../../cxapp/database/table-names.js"
import {
  storefrontCommunicationResendPayloadSchema,
  storefrontCommunicationResendResponseSchema,
  storefrontCommunicationLogResponseSchema,
  storefrontCommunicationTemplateCodeSchema,
  type StorefrontCommunicationLogItem,
} from "../../shared/index.js"

import { getStorefrontSettings } from "./storefront-settings-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"
import {
  sendStorefrontOrderConfirmedEmail,
  sendStorefrontPaymentFailedEmail,
  sendStorefrontWelcomeEmail,
} from "./storefront-mail-service.js"
import { listWelcomeMailProducts, readCustomerAccounts } from "./customer-service.js"
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"

const requiredTemplateCodes = [
  "storefront_customer_welcome",
  "storefront_order_confirmed",
  "storefront_payment_failed",
] as const

function mapCommunicationLogRow(row: Record<string, unknown>): StorefrontCommunicationLogItem {
  return {
    id: String(row.id ?? ""),
    templateCode: storefrontCommunicationTemplateCodeSchema.parse(String(row.template_code ?? "")),
    templateName: row.template_name == null ? null : String(row.template_name),
    subject: String(row.subject ?? ""),
    status:
      row.status === "queued" || row.status === "sent" || row.status === "failed"
        ? row.status
        : "failed",
    recipientSummary: String(row.recipient_summary ?? ""),
    referenceType: row.reference_type == null ? null : String(row.reference_type),
    referenceId: row.reference_id == null ? null : String(row.reference_id),
    errorMessage: row.error_message == null ? null : String(row.error_message),
    sentAt: row.sent_at == null ? null : String(row.sent_at),
    failedAt: row.failed_at == null ? null : String(row.failed_at),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  }
}

export async function assertStorefrontMailboxTemplates(database: Kysely<unknown>) {
  const queryDatabase = asQueryDatabase(database)
  const missing: string[] = []
  const inactive: string[] = []

  for (const code of requiredTemplateCodes) {
    const template = await queryDatabase
      .selectFrom(cxappTableNames.mailboxTemplates)
      .select(["id", "is_active"])
      .where("code", "=", code)
      .executeTakeFirst()

    if (!template) {
      missing.push(code)
      continue
    }

    if (Number(template.is_active ?? 0) !== 1) {
      inactive.push(code)
    }
  }

  if (missing.length > 0 || inactive.length > 0) {
    throw new ApplicationError(
      "Storefront mailbox templates are not ready.",
      {
        missing,
        inactive,
      },
      503
    )
  }

  return {
    ready: true as const,
    checkedTemplateCodes: [...requiredTemplateCodes],
  }
}

export async function listStorefrontCommunicationLog(
  database: Kysely<unknown>,
  input?: {
    orderId?: string | null
    customerAccountId?: string | null
  }
) {
  const queryDatabase = asQueryDatabase(database)
  let query = queryDatabase
    .selectFrom(cxappTableNames.mailboxMessages)
    .leftJoin(
      cxappTableNames.mailboxTemplates,
      `${cxappTableNames.mailboxTemplates}.id`,
      `${cxappTableNames.mailboxMessages}.template_id`
    )
    .select([
      `${cxappTableNames.mailboxMessages}.id as id`,
      `${cxappTableNames.mailboxMessages}.template_code as template_code`,
      `${cxappTableNames.mailboxTemplates}.name as template_name`,
      `${cxappTableNames.mailboxMessages}.subject as subject`,
      `${cxappTableNames.mailboxMessages}.status as status`,
      `${cxappTableNames.mailboxMessages}.reference_type as reference_type`,
      `${cxappTableNames.mailboxMessages}.reference_id as reference_id`,
      `${cxappTableNames.mailboxMessages}.error_message as error_message`,
      `${cxappTableNames.mailboxMessages}.sent_at as sent_at`,
      `${cxappTableNames.mailboxMessages}.failed_at as failed_at`,
      `${cxappTableNames.mailboxMessages}.created_at as created_at`,
      `${cxappTableNames.mailboxMessages}.updated_at as updated_at`,
    ])
    .orderBy(`${cxappTableNames.mailboxMessages}.created_at`, "desc")

  if (input?.orderId) {
    query = query.where(`${cxappTableNames.mailboxMessages}.reference_id`, "=", input.orderId)
  } else if (input?.customerAccountId) {
    query = query.where(`${cxappTableNames.mailboxMessages}.reference_id`, "=", input.customerAccountId)
  } else {
    query = query.where(`${cxappTableNames.mailboxMessages}.template_code`, "in", [
      ...requiredTemplateCodes,
      "storefront_campaign_subscription",
      "storefront_order_review_request",
      "storefront_order_shipped",
      "storefront_order_delivered",
    ])
  }

  const rows = await query.execute()
  const messages = await Promise.all(
    rows.map(async (row) => {
      const recipients = await queryDatabase
        .selectFrom(cxappTableNames.mailboxMessageRecipients)
        .select(["email", "name"])
        .where("message_id", "=", String(row.id))
        .orderBy("created_at")
        .execute()
      const recipientSummary = recipients
        .map((recipient) => recipient.name || recipient.email)
        .join(", ")

      return mapCommunicationLogRow({
        ...row,
        recipient_summary: recipientSummary || "No recipients",
      })
    })
  )

  return storefrontCommunicationLogResponseSchema.parse({
    items: messages,
  })
}

export async function listCustomerCommunicationLog(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  input?: {
    orderId?: string | null
  }
) {
  const [account, orders] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontOrders(database),
  ])
  const customerOrders = orders.filter(
    (item) =>
      item.customerAccountId === account.id ||
      item.coreContactId === account.coreContactId ||
      item.shippingAddress.email.trim().toLowerCase() === account.email.trim().toLowerCase()
  )
  const allowedOrderIds = new Set(customerOrders.map((item) => item.id))

  if (input?.orderId?.trim() && !allowedOrderIds.has(input.orderId)) {
    throw new ApplicationError(
      "Communication history can only be viewed for your own orders.",
      { orderId: input.orderId },
      403
    )
  }

  const queryDatabase = asQueryDatabase(database)
  let query = queryDatabase
    .selectFrom(cxappTableNames.mailboxMessages)
    .leftJoin(
      cxappTableNames.mailboxTemplates,
      `${cxappTableNames.mailboxTemplates}.id`,
      `${cxappTableNames.mailboxMessages}.template_id`
    )
    .select([
      `${cxappTableNames.mailboxMessages}.id as id`,
      `${cxappTableNames.mailboxMessages}.template_code as template_code`,
      `${cxappTableNames.mailboxTemplates}.name as template_name`,
      `${cxappTableNames.mailboxMessages}.subject as subject`,
      `${cxappTableNames.mailboxMessages}.status as status`,
      `${cxappTableNames.mailboxMessages}.reference_type as reference_type`,
      `${cxappTableNames.mailboxMessages}.reference_id as reference_id`,
      `${cxappTableNames.mailboxMessages}.error_message as error_message`,
      `${cxappTableNames.mailboxMessages}.sent_at as sent_at`,
      `${cxappTableNames.mailboxMessages}.failed_at as failed_at`,
      `${cxappTableNames.mailboxMessages}.created_at as created_at`,
      `${cxappTableNames.mailboxMessages}.updated_at as updated_at`,
    ])
    .where(`${cxappTableNames.mailboxMessages}.template_code`, "in", [
      ...requiredTemplateCodes,
      "storefront_campaign_subscription",
      "storefront_order_review_request",
      "storefront_order_shipped",
      "storefront_order_delivered",
    ])
    .orderBy(`${cxappTableNames.mailboxMessages}.created_at`, "desc")

  if (input?.orderId?.trim()) {
    query = query.where(`${cxappTableNames.mailboxMessages}.reference_id`, "=", input.orderId)
  } else {
    const allowedReferenceIds = [account.id, ...customerOrders.map((item) => item.id)]

    if (allowedReferenceIds.length === 0) {
      return storefrontCommunicationLogResponseSchema.parse({
        items: [],
      })
    }

    query = query.where(`${cxappTableNames.mailboxMessages}.reference_id`, "in", allowedReferenceIds)
  }

  const rows = await query.execute()
  const messages = await Promise.all(
    rows.map(async (row) => {
      const recipients = await queryDatabase
        .selectFrom(cxappTableNames.mailboxMessageRecipients)
        .select(["email", "name"])
        .where("message_id", "=", String(row.id))
        .orderBy("created_at")
        .execute()
      const recipientSummary = recipients
        .map((recipient) => recipient.name || recipient.email)
        .join(", ")

      return mapCommunicationLogRow({
        ...row,
        recipient_summary: recipientSummary || "No recipients",
      })
    })
  )

  return storefrontCommunicationLogResponseSchema.parse({
    items: messages,
  })
}

export async function resendStorefrontCommunication(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
) {
  const parsed = storefrontCommunicationResendPayloadSchema.parse(payload)
  await assertStorefrontMailboxTemplates(database)

  const settings = await getStorefrontSettings(database)
  const mailboxService = createMailboxService(database, config)

  if (parsed.templateCode === "storefront_customer_welcome") {
    if (!parsed.customerAccountId) {
      throw new ApplicationError("Customer account id is required for welcome email resend.", {}, 400)
    }

    const accounts = await readCustomerAccounts(database)
    const account = accounts.find((item) => item.id === parsed.customerAccountId)

    if (!account) {
      throw new ApplicationError("Customer account could not be found.", { customerAccountId: parsed.customerAccountId }, 404)
    }

    const newArrivalItems = await listWelcomeMailProducts(database)

    try {
      await sendStorefrontWelcomeEmail({
        mailboxService,
        config,
        settings,
        account,
        newArrivalItems,
      })
      return storefrontCommunicationResendResponseSchema.parse({
        resent: true,
        templateCode: parsed.templateCode,
        referenceId: account.id,
        deliveryStatus: "sent",
        message: "Welcome email resend was queued successfully.",
      })
    } catch (error) {
      return storefrontCommunicationResendResponseSchema.parse({
        resent: false,
        templateCode: parsed.templateCode,
        referenceId: account.id,
        deliveryStatus: "failed",
        message: error instanceof Error ? error.message : "Welcome email resend failed.",
      })
    }
  }

  if (!parsed.orderId) {
    throw new ApplicationError("Order id is required for storefront order communication resend.", {}, 400)
  }

  const orders = await readStorefrontOrders(database)
  const order = orders.find((item) => item.id === parsed.orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.orderId }, 404)
  }

  if (parsed.templateCode === "storefront_order_confirmed") {
    try {
      await sendStorefrontOrderConfirmedEmail({
        mailboxService,
        config,
        settings,
        order,
        customerEmail: order.shippingAddress.email,
        customerName: order.shippingAddress.fullName,
      })
      return storefrontCommunicationResendResponseSchema.parse({
        resent: true,
        templateCode: parsed.templateCode,
        referenceId: order.id,
        deliveryStatus: "sent",
        message: "Order confirmation email resend was queued successfully.",
      })
    } catch (error) {
      return storefrontCommunicationResendResponseSchema.parse({
        resent: false,
        templateCode: parsed.templateCode,
        referenceId: order.id,
        deliveryStatus: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Order confirmation email resend failed.",
      })
    }
  } else if (parsed.templateCode === "storefront_payment_failed") {
    try {
      await sendStorefrontPaymentFailedEmail({
        mailboxService,
        config,
        settings,
        order,
        customerEmail: order.shippingAddress.email,
        customerName: order.shippingAddress.fullName,
        failureReason: order.refund?.statusSummary ?? null,
      })
      return storefrontCommunicationResendResponseSchema.parse({
        resent: true,
        templateCode: parsed.templateCode,
        referenceId: order.id,
        deliveryStatus: "sent",
        message: "Payment failed email resend was queued successfully.",
      })
    } catch (error) {
      return storefrontCommunicationResendResponseSchema.parse({
        resent: false,
        templateCode: parsed.templateCode,
        referenceId: order.id,
        deliveryStatus: "failed",
        message:
          error instanceof Error ? error.message : "Payment failed email resend failed.",
      })
    }
  } else {
    throw new ApplicationError(
      "Resend is not implemented for this storefront communication template yet.",
      {
        templateCode: parsed.templateCode,
      },
      400
    )
  }

}
