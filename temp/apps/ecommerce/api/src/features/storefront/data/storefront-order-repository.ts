import type {
  StorefrontCheckoutPayload,
  StorefrontOrder,
  StorefrontOrderItem,
  StorefrontPaymentVerificationPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { productTableNames, storefrontTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface CheckoutProductRow extends RowDataPacket {
  id: string
  name: string
  slug: string
  sku: string
  base_price: number | string
  inventory: number | string | null
}

interface StorefrontOrderRow extends RowDataPacket {
  id: string
  order_number: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state_name: string
  country_name: string
  postal_code: string
  customer_note: string | null
  delivery_method: string
  payment_method: string
  payment_status: string
  payment_gateway: string | null
  payment_gateway_order_id: string | null
  payment_gateway_payment_id: string | null
  payment_gateway_signature: string | null
  payment_captured_at: Date | string | null
  subtotal: number | string
  shipping_amount: number | string
  handling_amount: number | string
  total_amount: number | string
  currency_code: string
  created_at: Date | string
  updated_at: Date | string
}

interface StorefrontOrderItemRow extends RowDataPacket {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_slug: string
  sku: string
  size_value: string
  color_value: string
  quantity: number | string
  unit_price: number | string
  line_total: number | string
  created_at: Date | string
  updated_at: Date | string
}

type PreparedCheckout = {
  orderId: string
  orderNumber: string
  payload: StorefrontCheckoutPayload
  items: StorefrontOrderItem[]
  subtotal: number
  shippingAmount: number
  handlingAmount: number
  totalAmount: number
  currency: string
}

type PersistedPaymentState = {
  status: string
  paymentStatus: string
  paymentGateway: string | null
  paymentGatewayOrderId: string | null
  paymentGatewayPaymentId: string | null
  paymentGatewaySignature: string | null
  paymentCapturedAt: Date | null
}

const currencyCode = 'INR'
const shippingThreshold = 5000
const standardShippingAmount = 199
const handlingAmount = 99

function asTimestamp(value: Date | string) {
  return new Date(value).toISOString()
}

function normalizeText(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed !== '-' ? trimmed : fallback
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createOrderNumber() {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  return `SO-${datePart}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function mapOrderItemRow(row: StorefrontOrderItemRow): StorefrontOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    sku: row.sku,
    size: row.size_value,
    color: row.color_value,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function mapOrderRow(row: StorefrontOrderRow, items: StorefrontOrderItem[]): StorefrontOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state_name,
    country: row.country_name,
    postalCode: row.postal_code,
    note: row.customer_note,
    deliveryMethod: row.delivery_method as StorefrontOrder['deliveryMethod'],
    paymentMethod: row.payment_method as StorefrontOrder['paymentMethod'],
    paymentStatus: row.payment_status,
    paymentGateway: row.payment_gateway,
    paymentGatewayOrderId: row.payment_gateway_order_id,
    paymentGatewayPaymentId: row.payment_gateway_payment_id,
    paymentGatewaySignature: row.payment_gateway_signature,
    paymentCapturedAt: row.payment_captured_at ? asTimestamp(row.payment_captured_at) : null,
    subtotal: Number(row.subtotal),
    shippingAmount: Number(row.shipping_amount),
    handlingAmount: Number(row.handling_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency_code,
    items,
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

export class StorefrontOrderRepository {
  async prepareCheckout(payload: StorefrontCheckoutPayload): Promise<PreparedCheckout> {
    await ensureDatabaseSchema()

    const uniqueProductIds = [...new Set(payload.items.map((item) => item.productId))]
    const placeholders = uniqueProductIds.map(() => '?').join(', ')
    const productRows = uniqueProductIds.length === 0
      ? []
      : await db.query<CheckoutProductRow>(
          `
            SELECT
              p.id,
              p.name,
              p.slug,
              p.sku,
              p.base_price,
              COALESCE(
                (
                  SELECT SUM(si.quantity - si.reserved_quantity)
                  FROM ${productTableNames.stockItems} si
                  WHERE si.product_id = p.id AND si.is_active = 1
                ),
                (
                  SELECT SUM(pv.stock_quantity)
                  FROM ${productTableNames.variants} pv
                  WHERE pv.product_id = p.id AND pv.is_active = 1
                ),
                0
              ) AS inventory
            FROM ${productTableNames.products} p
            WHERE p.id IN (${placeholders}) AND p.is_active = 1
          `,
          uniqueProductIds,
        )

    const productById = new Map(productRows.map((row) => [row.id, row]))
    for (const item of payload.items) {
      const product = productById.get(item.productId)
      if (!product) {
        throw new ApplicationError('One or more checkout products could not be found.', { productId: item.productId }, 400)
      }

      const inventory = product.inventory == null ? 0 : Number(product.inventory)
      if (item.quantity > inventory) {
        throw new ApplicationError(
          `Requested quantity exceeds available stock for ${normalizeText(product.name, 'product')}.`,
          { productId: item.productId, requested: item.quantity, available: inventory },
          400,
        )
      }
    }

    const orderId = randomUUID()
    const orderNumber = createOrderNumber()
    const timestamp = new Date().toISOString()

    const items = payload.items.map<StorefrontOrderItem>((item) => {
      const product = productById.get(item.productId)
      if (!product) {
        throw new ApplicationError('Checkout product lookup failed.', { productId: item.productId }, 500)
      }

      const unitPrice = Number(product.base_price)
      const lineTotal = unitPrice * item.quantity
      const productName = normalizeText(product.name, `Product ${product.id.slice(-6)}`)
      const productSlug = slugify(normalizeText(product.slug, `${productName}-${product.id.slice(-6)}`)) || `product-${product.id.slice(-6)}`

      return {
        id: randomUUID(),
        orderId,
        productId: product.id,
        productName,
        productSlug,
        sku: normalizeText(product.sku, `SKU-${product.id.slice(-6)}`),
        size: normalizeText(item.size, 'Default'),
        color: normalizeText(item.color, 'Default'),
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    })

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0)
    const shippingAmount = subtotal > shippingThreshold ? 0 : standardShippingAmount
    const totalAmount = subtotal + shippingAmount + handlingAmount

    return {
      orderId,
      orderNumber,
      payload,
      items,
      subtotal,
      shippingAmount,
      handlingAmount,
      totalAmount,
      currency: currencyCode,
    }
  }

  async createPlacedOrder(payload: StorefrontCheckoutPayload) {
    const prepared = await this.prepareCheckout(payload)
    return this.persistOrder(prepared, {
      status: 'placed',
      paymentStatus: payload.paymentMethod === 'cod' ? 'pending' : 'captured',
      paymentGateway: null,
      paymentGatewayOrderId: null,
      paymentGatewayPaymentId: null,
      paymentGatewaySignature: null,
      paymentCapturedAt: payload.paymentMethod === 'cod' ? null : new Date(),
    })
  }

  async createPendingPaymentOrder(prepared: PreparedCheckout, gatewayOrderId: string) {
    return this.persistOrder(prepared, {
      status: 'pending_payment',
      paymentStatus: 'created',
      paymentGateway: 'razorpay',
      paymentGatewayOrderId: gatewayOrderId,
      paymentGatewayPaymentId: null,
      paymentGatewaySignature: null,
      paymentCapturedAt: null,
    })
  }

  async markOrderPaid(payload: StorefrontPaymentVerificationPayload) {
    await ensureDatabaseSchema()

    const order = await this.getOrderRowById(payload.storefrontOrderId)
    if (!order) {
      throw new ApplicationError('Storefront order could not be found.', { storefrontOrderId: payload.storefrontOrderId }, 404)
    }

    if (order.payment_gateway !== 'razorpay') {
      throw new ApplicationError('This storefront order is not linked to Razorpay.', { storefrontOrderId: payload.storefrontOrderId }, 400)
    }

    if (order.payment_gateway_order_id !== payload.razorpayOrderId) {
      throw new ApplicationError('Razorpay order mismatch for this storefront order.', {
        storefrontOrderId: payload.storefrontOrderId,
        razorpayOrderId: payload.razorpayOrderId,
      }, 400)
    }

    if (order.payment_status === 'captured' || order.status === 'paid') {
      return this.getById(order.id)
    }

    await db.execute(
      `
        UPDATE ${storefrontTableNames.orders}
        SET
          status = ?,
          payment_status = ?,
          payment_gateway_payment_id = ?,
          payment_gateway_signature = ?,
          payment_captured_at = ?
        WHERE id = ?
      `,
      ['paid', 'captured', payload.razorpayPaymentId, payload.razorpaySignature, new Date(), order.id],
    )

    return this.getById(order.id)
  }

  async getById(id: string) {
    await ensureDatabaseSchema()

    const order = await this.getOrderRowById(id)
    if (!order) {
      throw new ApplicationError('Storefront order could not be found.', { orderId: id }, 404)
    }

    const itemRows = await db.query<StorefrontOrderItemRow>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_slug,
          sku,
          size_value,
          color_value,
          quantity,
          unit_price,
          line_total,
          created_at,
          updated_at
        FROM ${storefrontTableNames.orderItems}
        WHERE order_id = ?
        ORDER BY created_at ASC
      `,
      [id],
    )

    return mapOrderRow(order, itemRows.map(mapOrderItemRow))
  }

  async listByCustomerEmail(email: string) {
    await ensureDatabaseSchema()

    const normalizedEmail = email.trim().toLowerCase()
    const rows = await db.query<StorefrontOrderRow>(
      `
        SELECT
          id,
          order_number,
          status,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state_name,
          country_name,
          postal_code,
          customer_note,
          delivery_method,
          payment_method,
          payment_status,
          payment_gateway,
          payment_gateway_order_id,
          payment_gateway_payment_id,
          payment_gateway_signature,
          payment_captured_at,
          subtotal,
          shipping_amount,
          handling_amount,
          total_amount,
          currency_code,
          created_at,
          updated_at
        FROM ${storefrontTableNames.orders}
        WHERE LOWER(email) = ?
        ORDER BY created_at DESC
      `,
      [normalizedEmail],
    )

    if (rows.length === 0) {
      return []
    }

    const orderIds = rows.map((row) => row.id)
    const placeholders = orderIds.map(() => '?').join(', ')
    const itemRows = await db.query<StorefrontOrderItemRow>(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_slug,
          sku,
          size_value,
          color_value,
          quantity,
          unit_price,
          line_total,
          created_at,
          updated_at
        FROM ${storefrontTableNames.orderItems}
        WHERE order_id IN (${placeholders})
        ORDER BY created_at ASC
      `,
      orderIds,
    )

    const itemsByOrderId = new Map<string, StorefrontOrderItem[]>()
    for (const itemRow of itemRows) {
      const current = itemsByOrderId.get(itemRow.order_id) ?? []
      current.push(mapOrderItemRow(itemRow))
      itemsByOrderId.set(itemRow.order_id, current)
    }

    return rows.map((row) => mapOrderRow(row, itemsByOrderId.get(row.id) ?? []))
  }

  private async persistOrder(prepared: PreparedCheckout, paymentState: PersistedPaymentState) {
    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${storefrontTableNames.orders} (
            id,
            order_number,
            status,
            first_name,
            last_name,
            email,
            phone,
            address_line1,
            address_line2,
            city,
            state_name,
            country_name,
            postal_code,
            customer_note,
            delivery_method,
            payment_method,
            payment_status,
            payment_gateway,
            payment_gateway_order_id,
            payment_gateway_payment_id,
            payment_gateway_signature,
            payment_captured_at,
            subtotal,
            shipping_amount,
            handling_amount,
            total_amount,
            currency_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          prepared.orderId,
          prepared.orderNumber,
          paymentState.status,
          prepared.payload.firstName,
          prepared.payload.lastName,
          prepared.payload.email,
          prepared.payload.phone,
          prepared.payload.addressLine1,
          prepared.payload.addressLine2,
          prepared.payload.city,
          prepared.payload.state,
          prepared.payload.country,
          prepared.payload.postalCode,
          prepared.payload.note,
          prepared.payload.deliveryMethod,
          prepared.payload.paymentMethod,
          paymentState.paymentStatus,
          paymentState.paymentGateway,
          paymentState.paymentGatewayOrderId,
          paymentState.paymentGatewayPaymentId,
          paymentState.paymentGatewaySignature,
          paymentState.paymentCapturedAt,
          prepared.subtotal,
          prepared.shippingAmount,
          prepared.handlingAmount,
          prepared.totalAmount,
          prepared.currency,
        ],
      )

      for (const item of prepared.items) {
        await transaction.execute(
          `
            INSERT INTO ${storefrontTableNames.orderItems} (
              id,
              order_id,
              product_id,
              product_name,
              product_slug,
              sku,
              size_value,
              color_value,
              quantity,
              unit_price,
              line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            item.id,
            prepared.orderId,
            item.productId,
            item.productName,
            item.productSlug,
            item.sku,
            item.size,
            item.color,
            item.quantity,
            item.unitPrice,
            item.lineTotal,
          ],
        )
      }
    })

    const now = new Date()

    return {
      id: prepared.orderId,
      orderNumber: prepared.orderNumber,
      status: paymentState.status,
      firstName: prepared.payload.firstName,
      lastName: prepared.payload.lastName,
      email: prepared.payload.email,
      phone: prepared.payload.phone,
      addressLine1: prepared.payload.addressLine1,
      addressLine2: prepared.payload.addressLine2,
      city: prepared.payload.city,
      state: prepared.payload.state,
      country: prepared.payload.country,
      postalCode: prepared.payload.postalCode,
      note: prepared.payload.note,
      deliveryMethod: prepared.payload.deliveryMethod,
      paymentMethod: prepared.payload.paymentMethod,
      paymentStatus: paymentState.paymentStatus,
      paymentGateway: paymentState.paymentGateway,
      paymentGatewayOrderId: paymentState.paymentGatewayOrderId,
      paymentGatewayPaymentId: paymentState.paymentGatewayPaymentId,
      paymentGatewaySignature: paymentState.paymentGatewaySignature,
      paymentCapturedAt: paymentState.paymentCapturedAt ? asTimestamp(paymentState.paymentCapturedAt) : null,
      subtotal: prepared.subtotal,
      shippingAmount: prepared.shippingAmount,
      handlingAmount: prepared.handlingAmount,
      totalAmount: prepared.totalAmount,
      currency: prepared.currency,
      items: prepared.items.map((item) => ({ ...item })),
      createdAt: asTimestamp(now),
      updatedAt: asTimestamp(now),
    } satisfies StorefrontOrder
  }

  private async getOrderRowById(id: string) {
    const rows = await db.query<StorefrontOrderRow>(
      `
        SELECT
          id,
          order_number,
          status,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state_name,
          country_name,
          postal_code,
          customer_note,
          delivery_method,
          payment_method,
          payment_status,
          payment_gateway,
          payment_gateway_order_id,
          payment_gateway_payment_id,
          payment_gateway_signature,
          payment_captured_at,
          subtotal,
          shipping_amount,
          handling_amount,
          total_amount,
          currency_code,
          created_at,
          updated_at
        FROM ${storefrontTableNames.orders}
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    return rows[0] ?? null
  }
}
