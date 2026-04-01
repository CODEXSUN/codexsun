import { createHmac, timingSafeEqual } from 'node:crypto'
import { environment } from '../config/environment'
import { ApplicationError } from '../errors/application-error'

type RazorpayOrderRequest = {
  amount: number
  currency: string
  receipt: string
  notes?: Record<string, string>
}

type RazorpayOrderResponse = {
  id: string
  amount: number
  currency: string
  receipt: string | null
  status: string
}

function getAuthorizationHeader() {
  if (!environment.payments.razorpay.enabled) {
    throw new ApplicationError('Razorpay is not configured on the server.', {}, 503)
  }

  return `Basic ${Buffer.from(`${environment.payments.razorpay.keyId}:${environment.payments.razorpay.keySecret}`).toString('base64')}`
}

export async function createRazorpayOrder(payload: RazorpayOrderRequest): Promise<RazorpayOrderResponse> {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: getAuthorizationHeader(),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => null)) as
    | {
        id?: string
        amount?: number
        currency?: string
        receipt?: string | null
        status?: string
        error?: { description?: string; code?: string }
      }
    | null

  if (!response.ok || !body?.id || typeof body.amount !== 'number' || typeof body.currency !== 'string') {
    throw new ApplicationError(
      body?.error?.description ?? 'Razorpay order creation failed.',
      {
        provider: 'razorpay',
        statusCode: response.status,
        code: body?.error?.code ?? 'unknown',
      },
      502,
    )
  }

  return {
    id: body.id,
    amount: body.amount,
    currency: body.currency,
    receipt: body.receipt ?? null,
    status: body.status ?? 'created',
  }
}

export function verifyRazorpayPaymentSignature(input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) {
  if (!environment.payments.razorpay.enabled) {
    throw new ApplicationError('Razorpay is not configured on the server.', {}, 503)
  }

  if (!environment.payments.razorpay.keySecret) {
    throw new ApplicationError('Razorpay key secret is missing.', {}, 500)
  }

  const expectedSignature = createHmac('sha256', environment.payments.razorpay.keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(input.razorpaySignature)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}
