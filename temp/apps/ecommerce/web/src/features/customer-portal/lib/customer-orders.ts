import type { StorefrontOrder, CommerceOrderWorkflow } from '@/features/store/types/storefront'
import { useEffect, useState } from 'react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { HttpError, listCustomerOrders, getCustomerOrderWorkflow } from '@/shared/api/client'

export type CustomerOrderNotification = {
  id: string
  title: string
  description: string
  createdAt: string
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load customer order data.'
}

export function getCustomerPaymentLabel(order: StorefrontOrder) {
  if (order.paymentGateway === 'razorpay') {
    return 'Razorpay'
  }

  if (order.paymentGateway === 'test_bypass') {
    return 'Test bypass'
  }

  if (order.paymentMethod === 'cod') {
    return 'Cash on delivery'
  }

  return order.paymentMethod === 'card' ? 'Card payment' : 'UPI / Wallet'
}

export function describeCustomerOrder(order: StorefrontOrder) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)
  const itemLabel = itemCount === 1 ? 'item' : 'items'

  if (order.paymentGateway === 'test_bypass') {
    return `Test checkout completed for ${itemCount} ${itemLabel}.`
  }

  if (order.paymentStatus === 'captured') {
    return `Payment captured and order confirmed for ${itemCount} ${itemLabel}.`
  }

  if (order.paymentMethod === 'cod') {
    return `Cash on delivery order created for ${itemCount} ${itemLabel}.`
  }

  return `Order created for ${itemCount} ${itemLabel}. Awaiting payment confirmation.`
}

export function buildCustomerNotifications(orders: StorefrontOrder[]): CustomerOrderNotification[] {
  return orders.flatMap((order) => {
    const notifications: CustomerOrderNotification[] = [
      {
        id: `${order.id}:status`,
        title: `Order ${order.orderNumber}`,
        description: describeCustomerOrder(order),
        createdAt: order.updatedAt,
      },
    ]

    if (order.paymentStatus === 'captured') {
      notifications.push({
        id: `${order.id}:payment`,
        title: `Payment confirmed for ${order.orderNumber}`,
        description: `${getCustomerPaymentLabel(order)} completed successfully.`,
        createdAt: order.paymentCapturedAt ?? order.updatedAt,
      })
    }

    return notifications
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function useCustomerOrders() {
  const { session } = useAuth()
  const token = session?.accessToken ?? null
  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token || session?.user.actorType !== 'customer') {
      setOrders([])
      setIsLoading(false)
      setErrorMessage(null)
      return
    }

    let cancelled = false

    async function load() {
      const authToken = token
      if (!authToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const items = await listCustomerOrders(authToken)
        if (!cancelled) {
          setOrders(items)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [session?.user.actorType, token])

  return {
    orders,
    isLoading,
    errorMessage,
    notifications: buildCustomerNotifications(orders),
  }
}

export function useCustomerOrderWorkflow(orderId: string | undefined) {
  const { session } = useAuth()
  const token = session?.accessToken ?? null
  const [workflow, setWorkflow] = useState<CommerceOrderWorkflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !orderId || session?.user.actorType !== 'customer') {
      setWorkflow(null)
      setIsLoading(false)
      setErrorMessage(null)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getCustomerOrderWorkflow(token!, orderId!)
        if (!cancelled) {
          setWorkflow(data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [session?.user.actorType, token, orderId])

  return {
    workflow,
    isLoading,
    errorMessage,
  }
}
