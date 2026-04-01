import type {
  StorefrontOrderListResponse,
  StorefrontCheckoutResponse,
  StorefrontCheckoutSessionResponse,
} from '@shared/index'
import {
  storefrontOrderListResponseSchema,
  storefrontCheckoutPayloadSchema,
  storefrontCheckoutResponseSchema,
  storefrontCheckoutSessionResponseSchema,
  storefrontPaymentVerificationPayloadSchema,
} from '@shared/index'
import { environment } from '@framework-core/runtime/config/environment'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from '@framework-core/runtime/payments/razorpay'
import { CommerceOrderWorkflowRepository } from '../../commerce/data/commerce-order-workflow-repository'
import type { StorefrontOrderRepository } from '../data/storefront-order-repository'

export class StorefrontOrderService {
  private readonly workflowRepository = new CommerceOrderWorkflowRepository()

  constructor(private readonly repository: StorefrontOrderRepository) {}

  async create(payload: unknown) {
    const parsedPayload = storefrontCheckoutPayloadSchema.parse(payload)

    if (parsedPayload.paymentMethod === 'cod') {
      const order = await this.repository.createPlacedOrder(parsedPayload)
      await this.workflowRepository.initializeOrder(order)
      return storefrontCheckoutSessionResponseSchema.parse({
        order,
        requiresPayment: false,
        paymentSession: null,
      } satisfies StorefrontCheckoutSessionResponse)
    }

    if (!environment.payments.razorpay.enabled) {
      throw new ApplicationError('Razorpay is not configured for online payments.', {}, 503)
    }

    const preparedCheckout = await this.repository.prepareCheckout(parsedPayload)
    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(preparedCheckout.totalAmount * 100),
      currency: preparedCheckout.currency,
      receipt: preparedCheckout.orderNumber,
      notes: {
        storefront_order_id: preparedCheckout.orderId,
        storefront_order_number: preparedCheckout.orderNumber,
      },
    })
    const order = await this.repository.createPendingPaymentOrder(preparedCheckout, razorpayOrder.id)
    await this.workflowRepository.initializeOrder(order)

    return storefrontCheckoutSessionResponseSchema.parse({
      order,
      requiresPayment: true,
      paymentSession: {
        provider: 'razorpay',
        keyId: environment.payments.razorpay.keyId,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: environment.payments.razorpay.businessName,
        description: `Order ${order.orderNumber}`,
        image: environment.payments.razorpay.checkoutImage,
        prefillName: `${parsedPayload.firstName} ${parsedPayload.lastName}`.trim(),
        prefillEmail: parsedPayload.email,
        prefillContact: parsedPayload.phone,
        themeColor: environment.payments.razorpay.themeColor,
      },
    } satisfies StorefrontCheckoutSessionResponse)
  }

  async verifyPayment(payload: unknown) {
    const parsedPayload = storefrontPaymentVerificationPayloadSchema.parse(payload)
    const isValidSignature = verifyRazorpayPaymentSignature({
      razorpayOrderId: parsedPayload.razorpayOrderId,
      razorpayPaymentId: parsedPayload.razorpayPaymentId,
      razorpaySignature: parsedPayload.razorpaySignature,
    })

    if (!isValidSignature) {
      throw new ApplicationError('Razorpay payment signature verification failed.', {}, 400)
    }

    const order = await this.repository.markOrderPaid(parsedPayload)
    await this.workflowRepository.markPaymentCaptured(order.id)
    return storefrontCheckoutResponseSchema.parse({ order } satisfies StorefrontCheckoutResponse)
  }

  async listCustomerOrders(email: string) {
    const items = await this.repository.listByCustomerEmail(email)
    return storefrontOrderListResponseSchema.parse({ items } satisfies StorefrontOrderListResponse)
  }
}
