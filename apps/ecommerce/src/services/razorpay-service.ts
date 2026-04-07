import { createHmac, randomUUID } from "node:crypto"

import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  storefrontPaymentConfigSchema,
  storefrontPaymentSessionSchema,
  type StorefrontOrder,
} from "../../shared/index.js"

function toBasicAuthHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
}

function isRazorpayEnabled(config: ServerConfig) {
  return Boolean(
    config.commerce?.razorpay?.enabled &&
      config.commerce.razorpay.keyId &&
      config.commerce.razorpay.keySecret
  )
}

export function getRazorpayPaymentConfig(config: ServerConfig) {
  return storefrontPaymentConfigSchema.parse({
    provider: "razorpay",
    enabled: isRazorpayEnabled(config),
    mode: isRazorpayEnabled(config) ? "live" : "mock",
    keyId: config.commerce?.razorpay?.keyId ?? null,
    businessName: config.commerce?.razorpay?.businessName ?? "Tirupur Direct",
    checkoutImage: config.commerce?.razorpay?.checkoutImage ?? null,
    themeColor: config.commerce?.razorpay?.themeColor ?? null,
  })
}

export async function createRazorpayPaymentSession(
  config: ServerConfig,
  order: Pick<StorefrontOrder, "currency" | "id" | "orderNumber" | "totalAmount">
) {
  const paymentConfig = getRazorpayPaymentConfig(config)
  const amount = Math.round(order.totalAmount * 100)

  if (
    !paymentConfig.enabled ||
    !config.commerce?.razorpay?.keyId ||
    !config.commerce.razorpay.keySecret
  ) {
    return storefrontPaymentSessionSchema.parse({
      provider: "razorpay",
      mode: "mock",
      keyId: paymentConfig.keyId,
      providerOrderId: `mock_order_${randomUUID().replace(/-/g, "")}`,
      amount,
      currency: order.currency,
      receipt: order.orderNumber,
      businessName: paymentConfig.businessName,
      checkoutImage: paymentConfig.checkoutImage,
      themeColor: paymentConfig.themeColor,
    })
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: toBasicAuthHeader(
        config.commerce.razorpay.keyId,
        config.commerce.razorpay.keySecret
      ),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: order.currency,
      receipt: order.orderNumber,
      notes: {
        storefrontOrderId: order.id,
      },
    }),
  })

  if (!response.ok) {
    throw new ApplicationError(
      "Failed to create Razorpay order.",
      {
        status: response.status,
        body: await response.text(),
      },
      502
    )
  }

  const payload = (await response.json()) as {
    id?: string
    amount?: number
    currency?: string
    receipt?: string
  }

  return storefrontPaymentSessionSchema.parse({
    provider: "razorpay",
    mode: "live",
    keyId: config.commerce.razorpay.keyId,
    providerOrderId: payload.id ?? null,
    amount: payload.amount ?? amount,
    currency: payload.currency ?? order.currency,
    receipt: payload.receipt ?? order.orderNumber,
    businessName: config.commerce.razorpay.businessName,
    checkoutImage: config.commerce.razorpay.checkoutImage ?? null,
    themeColor: config.commerce.razorpay.themeColor ?? null,
  })
}

export function verifyRazorpaySignature(
  config: ServerConfig,
  input: {
    providerOrderId: string
    providerPaymentId: string
    signature: string
  }
) {
  if (
    input.signature === "mock_signature" &&
    input.providerPaymentId.startsWith("mock_payment_")
  ) {
    return true
  }

  if (!config.commerce?.razorpay?.enabled || !config.commerce.razorpay.keySecret) {
    return input.signature === "mock_signature"
  }

  const digest = createHmac("sha256", config.commerce.razorpay.keySecret)
    .update(`${input.providerOrderId}|${input.providerPaymentId}`)
    .digest("hex")

  return digest === input.signature
}

export function verifyRazorpayWebhookSignature(
  config: ServerConfig,
  input: {
    payloadBody: string
    signature: string
  }
) {
  const webhookSecret = config.commerce?.razorpay?.webhookSecret?.trim()

  if (!config.commerce?.razorpay?.enabled || !webhookSecret) {
    return false
  }

  const digest = createHmac("sha256", webhookSecret)
    .update(input.payloadBody)
    .digest("hex")

  return digest === input.signature
}

export async function fetchRazorpayOrderPayments(
  config: ServerConfig,
  providerOrderId: string
) {
  if (
    !config.commerce?.razorpay?.enabled ||
    !config.commerce.razorpay.keyId ||
    !config.commerce.razorpay.keySecret
  ) {
    throw new ApplicationError(
      "Razorpay reconciliation requires live Razorpay credentials.",
      {},
      503
    )
  }

  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${encodeURIComponent(providerOrderId)}/payments`,
    {
      method: "GET",
      headers: {
        authorization: toBasicAuthHeader(
          config.commerce.razorpay.keyId,
          config.commerce.razorpay.keySecret
        ),
      },
    }
  )

  if (!response.ok) {
    throw new ApplicationError(
      "Failed to fetch Razorpay order payments.",
      {
        providerOrderId,
        status: response.status,
        body: await response.text(),
      },
      502
    )
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string
      order_id?: string
      status?: string
      amount_refunded?: number
    }>
  }

  return (payload.items ?? []).map((item) => ({
    id: item.id ?? "",
    orderId: item.order_id ?? providerOrderId,
    status: item.status ?? "created",
    amountRefunded:
      typeof item.amount_refunded === "number" && Number.isFinite(item.amount_refunded)
        ? item.amount_refunded
        : 0,
  }))
}
