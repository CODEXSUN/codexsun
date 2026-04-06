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
